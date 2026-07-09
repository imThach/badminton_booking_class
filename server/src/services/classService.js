const mongoose = require('mongoose');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const AppError = require('../utils/appError');
const Coach = require('../models/Coach');
const { parseSchedule } = require('./sessionGeneratorService');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ALLOWED_CLASS_FIELDS = [
    'title',
    'description',
    'coachName',
    'coach',
    'level',
    'startDate',
    'endDate',
    'schedule',
    'location',
    'maxStudents',
    'price',
];
const OCCUPYING_ENROLLMENT_STATUSES = ['active', 'pending_payment'];
const occupyingStatusFilter = { $or: [{ status: { $in: OCCUPYING_ENROLLMENT_STATUSES } }, { status: { $exists: false } }] };
const activeStatusFilter = { $or: [{ status: 'active' }, { status: { $exists: false } }] };

const assertValidObjectId = (id, message) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new AppError(message, 400);
    }
};

const toClassResponse = (classDoc, currentStudentsOverride) => {
    const classObject = classDoc.toObject ? classDoc.toObject() : classDoc;

    return {
        ...classObject,
        currentStudents: currentStudentsOverride ?? classObject.currentStudents ?? 0,
    };
};

const addCurrentStudentsToClasses = async (classes) => {
    const classIds = classes.map((classItem) => classItem._id);

    if (classIds.length === 0) {
        return classes.map(toClassResponse);
    }

    const enrollmentCounts = await Enrollment.aggregate([
        { $match: { class: { $in: classIds }, ...occupyingStatusFilter } },
        { $group: { _id: '$class', currentStudents: { $sum: 1 } } },
    ]);
    const countByClassId = new Map(
        enrollmentCounts.map((item) => [item._id.toString(), item.currentStudents])
    );

    const classResponses = classes.map((classItem) => {
        const syncedCount = countByClassId.get(classItem._id.toString()) || 0;
        return toClassResponse(classItem, syncedCount);
    });

    return classResponses;
};

const addCurrentStudentsToClass = async (classDoc) => {
    const currentStudents = await Enrollment.countDocuments({ class: classDoc._id, ...occupyingStatusFilter });

    return toClassResponse(classDoc, currentStudents);
};

const syncClassCurrentStudents = async (classId) => {
    const currentStudents = await Enrollment.countDocuments({ class: classId, ...occupyingStatusFilter });
    const updatedClass = await Class.findByIdAndUpdate(
        classId,
        { currentStudents },
        { new: true, runValidators: true }
    );

    return updatedClass;
};

exports.syncClassCurrentStudents = syncClassCurrentStudents;

const pickClassFields = (payload = {}) =>
    ALLOWED_CLASS_FIELDS.reduce((pickedFields, field) => {
        if (payload[field] !== undefined) {
            pickedFields[field] = payload[field];
        }

        return pickedFields;
    }, {});

const assertCoachHasCapacity = async ({ coachId, excludeClassId }) => {
    if (!coachId) return;
    const assignedClasses = await Class.countDocuments({
        coach: coachId,
        ...(excludeClassId ? { _id: { $ne: excludeClassId } } : {}),
        $or: [{ endDate: { $gte: new Date() } }, { endDate: { $exists: false }, startDate: { $gte: new Date() } }],
    });
    if (assignedClasses >= 2) throw new AppError('This coach is already responsible for 2 active classes', 409);
};

exports.listClasses = async ({ level, limit = 20, page = 1, searchTerm, upcoming, minPrice, maxPrice, startDateFrom, startDateTo, coach, location, sort = 'date_asc' }) => {
    const skip = (page - 1) * limit;
    const filter = {};

    if (upcoming === 'true') {
        filter.startDate = { $gte: new Date() };
    }

    if (level) {
        filter.level = level;
    }

    if (searchTerm) {
        filter.title = { $regex: escapeRegex(searchTerm), $options: 'i' };
    }

    if (coach) filter.coachName = { $regex: escapeRegex(coach), $options: 'i' };
    if (location) filter.location = { $regex: escapeRegex(location), $options: 'i' };

    if (startDateFrom || startDateTo) {
        filter.startDate = filter.startDate || {};
        if (startDateFrom) filter.startDate.$gte = new Date(`${startDateFrom}T00:00:00`);
        if (startDateTo) filter.startDate.$lte = new Date(`${startDateTo}T23:59:59.999`);
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        const priceRange = {};
        if (minPrice !== undefined) priceRange.$gte = Number(minPrice);
        if (maxPrice !== undefined) priceRange.$lte = Number(maxPrice);
        filter.price = priceRange;
    }

    const sortMap = {
        date_asc: { startDate: 1 }, date_desc: { startDate: -1 },
        price_asc: { price: 1, startDate: 1 }, price_desc: { price: -1, startDate: 1 },
        popularity_desc: { currentStudents: -1, startDate: 1 }, popularity_asc: { currentStudents: 1, startDate: 1 },
    };

    const [classes, total] = await Promise.all([
        Class.find(filter)
            .sort(sortMap[sort] || sortMap.date_asc)
            .skip(skip)
            .limit(limit)
            .populate('createdBy', 'name email role').populate('coach', 'name photo bio isActive'),
        Class.countDocuments(filter),
    ]);

    return {
        classes: await addCurrentStudentsToClasses(classes),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

exports.getClassById = async (classId) => {
    assertValidObjectId(classId, 'Invalid class id');

    const classDetail = await Class.findById(classId).populate('createdBy', 'name email role').populate('coach', 'name photo bio isActive');
    if (!classDetail) {
        throw new AppError('Class not found', 404);
    }

    return addCurrentStudentsToClass(classDetail);
};

exports.createClass = async ({ payload, userId }) => {
    const classPayload = pickClassFields(payload);
    if (classPayload.coach) {
        const coach = await Coach.findOne({ _id: classPayload.coach, isActive: true });
        if (!coach) throw new AppError('Active coach not found', 404);
        classPayload.coachName = coach.name;
    }
    await assertCoachHasCapacity({
        coachId: classPayload.coach,
    });
    const newClass = await Class.create({
        ...classPayload,
        createdBy: userId,
    });
    const populatedClass = await Class.findById(newClass._id).populate('createdBy', 'name email role').populate('coach', 'name photo bio isActive');

    return addCurrentStudentsToClass(populatedClass);
};

exports.updateClass = async ({ classId, payload }) => {
    assertValidObjectId(classId, 'Invalid class id');
    const classPayload = pickClassFields(payload);
    if (classPayload.coach) {
        const coach = await Coach.findOne({ _id: classPayload.coach, isActive: true });
        if (!coach) throw new AppError('Active coach not found', 404);
        classPayload.coachName = coach.name;
    }
    const expectedUpdatedAt = payload?._updatedAt ? new Date(payload._updatedAt) : null;

    const classDetail = await Class.findById(classId);
    if (!classDetail) {
        throw new AppError('Class not found', 404);
    }

    if (expectedUpdatedAt && Number.isNaN(expectedUpdatedAt.getTime())) {
        throw new AppError('_updatedAt must be a valid date', 400);
    }

    if (expectedUpdatedAt && classDetail.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        throw new AppError('This class was updated by someone else. Please review the latest data before saving.', 409);
    }

    const effectiveCoach = classPayload.coach ?? classDetail.coach;
    const effectiveStart = classPayload.startDate ?? classDetail.startDate;
    const effectiveEnd = classPayload.endDate ?? classDetail.endDate;
    if (effectiveEnd && new Date(effectiveEnd) <= new Date(effectiveStart)) {
        throw new AppError('endDate must be after startDate', 400);
    }
    const effectiveSchedule = classPayload.schedule ?? classDetail.schedule;
    if (!parseSchedule(effectiveSchedule, effectiveStart, effectiveEnd)) {
        throw new AppError('schedule must contain valid weekdays; the class end time must be after its start time', 400);
    }
    await assertCoachHasCapacity({
        coachId: effectiveCoach,
        excludeClassId: classId,
    });

    if (classPayload.maxStudents !== undefined) {
        const enrolledStudents = await Enrollment.countDocuments({ class: classId, ...occupyingStatusFilter });

        if (Number(classPayload.maxStudents) < enrolledStudents) {
            throw new AppError(
                `Cannot set maxStudents to ${classPayload.maxStudents}. This class already has ${enrolledStudents} enrolled students.`,
                400
            );
        }
    }

    const updatedClass = await Class.findByIdAndUpdate(classId, classPayload, {
        new: true,
        runValidators: true,
    }).populate('createdBy', 'name email role').populate('coach', 'name photo bio isActive');

    return addCurrentStudentsToClass(updatedClass);
};

exports.deleteClass = async (classId) => {
    assertValidObjectId(classId, 'Invalid class id');

    const classDetail = await Class.findById(classId);
    if (!classDetail) {
        throw new AppError('Class not found', 404);
    }

    const enrolledStudents = await Enrollment.countDocuments({ class: classId, ...occupyingStatusFilter });
    if (enrolledStudents > 0) {
        throw new AppError(`Cannot delete this class because it has ${enrolledStudents} enrolled students.`, 400);
    }

    await Class.findByIdAndDelete(classId);
    return classDetail;
};

exports.getClassStudents = async (classId) => {
    assertValidObjectId(classId, 'Invalid class id');

    const classDetail = await Class.findById(classId).select('title maxStudents');
    if (!classDetail) {
        throw new AppError('Class not found', 404);
    }

    const enrollments = await Enrollment.find({ class: classId, ...activeStatusFilter })
        .sort({ enrolledAt: -1 })
        .populate('user', 'name email role isVerified createdAt');

    return {
        class: toClassResponse({
            ...classDetail.toObject(),
            currentStudents: enrollments.length,
        }),
        students: enrollments.map((enrollment) => ({
            enrollmentId: enrollment._id,
            enrolledAt: enrollment.enrolledAt,
            user: enrollment.user,
        })),
    };
};

exports.kickStudentFromClass = async ({ classId, userId }) => {
    assertValidObjectId(classId, 'Invalid class id');
    assertValidObjectId(userId, 'Invalid user id');

    const classDetail = await Class.findById(classId).select('title');
    if (!classDetail) {
        throw new AppError('Class not found', 404);
    }

    const enrollment = await Enrollment.findOneAndDelete({
        class: classId,
        user: userId,
        ...activeStatusFilter,
    }).populate('user', 'name email role');

    if (!enrollment) {
        const updatedClass = await syncClassCurrentStudents(classId);

        return {
            class: updatedClass || classDetail,
            removedStudent: null,
            alreadyRemoved: true,
        };
    }

    const updatedClass = await syncClassCurrentStudents(classId);

    return {
        class: updatedClass || classDetail,
        removedStudent: enrollment.user,
    };
};
