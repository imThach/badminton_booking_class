const mongoose = require('mongoose');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const AppError = require('../utils/appError');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ALLOWED_CLASS_FIELDS = [
    'title',
    'description',
    'coachName',
    'level',
    'startDate',
    'schedule',
    'location',
    'maxStudents',
];

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
    const classIdsNeedingSync = classes
        .filter((classItem) => classItem.currentStudents === undefined || classItem.currentStudents === 0)
        .map((classItem) => classItem._id);

    if (classIdsNeedingSync.length === 0) {
        return classes.map(toClassResponse);
    }

    const enrollmentCounts = await Enrollment.aggregate([
        { $match: { class: { $in: classIdsNeedingSync } } },
        { $group: { _id: '$class', currentStudents: { $sum: 1 } } },
    ]);
    const countByClassId = new Map(
        enrollmentCounts.map((item) => [item._id.toString(), item.currentStudents])
    );

    const classResponses = classes.map((classItem) => {
        const syncedCount = countByClassId.get(classItem._id.toString());
        return toClassResponse(classItem, syncedCount);
    });

    await Promise.all(
        classIdsNeedingSync.map((classId) =>
            Class.updateOne(
                { _id: classId },
                { $set: { currentStudents: countByClassId.get(classId.toString()) || 0 } }
            )
        )
    );

    return classResponses;
};

const addCurrentStudentsToClass = async (classDoc) => {
    if (classDoc.currentStudents !== undefined && classDoc.currentStudents > 0) {
        return toClassResponse(classDoc);
    }

    const currentStudents = await Enrollment.countDocuments({ class: classDoc._id });
    await Class.updateOne(
        { _id: classDoc._id },
        { $set: { currentStudents } }
    );

    return toClassResponse(classDoc, currentStudents);
};

const syncClassCurrentStudents = async (classId) => {
    const currentStudents = await Enrollment.countDocuments({ class: classId });
    const updatedClass = await Class.findByIdAndUpdate(
        classId,
        { currentStudents },
        { new: true, runValidators: true }
    );

    return updatedClass;
};

const pickClassFields = (payload = {}) =>
    ALLOWED_CLASS_FIELDS.reduce((pickedFields, field) => {
        if (payload[field] !== undefined) {
            pickedFields[field] = payload[field];
        }

        return pickedFields;
    }, {});

exports.listClasses = async ({ level, limit = 20, page = 1, searchTerm, upcoming }) => {
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

    const [classes, total] = await Promise.all([
        Class.find(filter)
            .sort({ startDate: 1 })
            .skip(skip)
            .limit(limit)
            .populate('createdBy', 'name email role'),
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

    const classDetail = await Class.findById(classId).populate('createdBy', 'name email role');
    if (!classDetail) {
        throw new AppError('Class not found', 404);
    }

    return addCurrentStudentsToClass(classDetail);
};

exports.createClass = async ({ payload, userId }) => {
    const classPayload = pickClassFields(payload);
    const newClass = await Class.create({
        ...classPayload,
        createdBy: userId,
    });
    const populatedClass = await Class.findById(newClass._id).populate('createdBy', 'name email role');

    return addCurrentStudentsToClass(populatedClass);
};

exports.updateClass = async ({ classId, payload }) => {
    assertValidObjectId(classId, 'Invalid class id');
    const classPayload = pickClassFields(payload);

    const classDetail = await Class.findById(classId);
    if (!classDetail) {
        throw new AppError('Class not found', 404);
    }

    if (classPayload.maxStudents !== undefined) {
        const enrolledStudents = await Enrollment.countDocuments({ class: classId });

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
    }).populate('createdBy', 'name email role');

    return addCurrentStudentsToClass(updatedClass);
};

exports.deleteClass = async (classId) => {
    assertValidObjectId(classId, 'Invalid class id');

    const classDetail = await Class.findById(classId);
    if (!classDetail) {
        throw new AppError('Class not found', 404);
    }

    const enrolledStudents = await Enrollment.countDocuments({ class: classId });
    if (enrolledStudents > 0) {
        throw new AppError(`Cannot delete this class because it has ${enrolledStudents} enrolled students.`, 400);
    }

    await Class.findByIdAndDelete(classId);
};

exports.getClassStudents = async (classId) => {
    assertValidObjectId(classId, 'Invalid class id');

    const classDetail = await Class.findById(classId).select('title maxStudents');
    if (!classDetail) {
        throw new AppError('Class not found', 404);
    }

    const enrollments = await Enrollment.find({ class: classId })
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
    }).populate('user', 'name email role');

    if (!enrollment) {
        throw new AppError('Student is not enrolled in this class', 404);
    }

    const updatedClass = await syncClassCurrentStudents(classId);

    return {
        class: updatedClass || classDetail,
        removedStudent: enrollment.user,
    };
};
