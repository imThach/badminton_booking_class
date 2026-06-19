const mongoose = require('mongoose');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const assertValidObjectId = (id, message) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new AppError(message, 400);
    }
};

const toClassResponse = (classDoc, currentStudents) => {
    const classObject = classDoc.toObject ? classDoc.toObject() : classDoc;

    return {
        ...classObject,
        currentStudents,
    };
};

const addCurrentStudentsToClasses = async (classes) => {
    const classIds = classes.map((classItem) => classItem._id);
    const enrollmentCounts = await Enrollment.aggregate([
        { $match: { class: { $in: classIds } } },
        { $group: { _id: '$class', currentStudents: { $sum: 1 } } },
    ]);
    const countByClassId = new Map(
        enrollmentCounts.map((item) => [item._id.toString(), item.currentStudents])
    );

    return classes.map((classItem) =>
        toClassResponse(classItem, countByClassId.get(classItem._id.toString()) || 0)
    );
};

const addCurrentStudentsToClass = async (classDoc) => {
    const currentStudents = await Enrollment.countDocuments({ class: classDoc._id });
    return toClassResponse(classDoc, currentStudents);
};

exports.getAllClasses = catchAsync(async (req, res) => {
    const { level, upcoming } = req.query;
    const searchTerm = req.query.name || req.query.title || req.query.search;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
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
    const classesWithCurrentStudents = await addCurrentStudentsToClasses(classes);

    res.status(200).json({
        status: 'success',
        results: classesWithCurrentStudents.length,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: {
            classes: classesWithCurrentStudents,
        },
    });
});

exports.getClass = catchAsync(async (req, res, next) => {
    assertValidObjectId(req.params.id, 'Invalid class id');

    const classDetail = await Class.findById(req.params.id).populate('createdBy', 'name email role');

    if (!classDetail) {
        return next(new AppError('Class not found', 404));
    }
    const classWithCurrentStudents = await addCurrentStudentsToClass(classDetail);

    res.status(200).json({
        status: 'success',
        data: {
            class: classWithCurrentStudents,
        },
    });
});

exports.createClass = catchAsync(async (req, res) => {
    const newClass = await Class.create({
        ...req.body,
        createdBy: req.user.id,
    });
    const populatedClass = await Class.findById(newClass._id).populate('createdBy', 'name email role');
    const classWithCurrentStudents = await addCurrentStudentsToClass(populatedClass);

    res.status(201).json({
        status: 'success',
        data: {
            class: classWithCurrentStudents,
        },
    });
});

exports.updateClass = catchAsync(async (req, res, next) => {
    assertValidObjectId(req.params.id, 'Invalid class id');

    const classDetail = await Class.findById(req.params.id);
    if (!classDetail) {
        return next(new AppError('Class not found', 404));
    }

    if (req.body.maxStudents !== undefined) {
        const enrolledStudents = await Enrollment.countDocuments({ class: req.params.id });

        if (Number(req.body.maxStudents) < enrolledStudents) {
            return next(
                new AppError(
                    `Cannot set maxStudents to ${req.body.maxStudents}. This class already has ${enrolledStudents} enrolled students.`,
                    400
                )
            );
        }
    }

    const updatedClass = await Class.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    }).populate('createdBy', 'name email role');
    const classWithCurrentStudents = await addCurrentStudentsToClass(updatedClass);

    res.status(200).json({
        status: 'success',
        data: {
            class: classWithCurrentStudents,
        },
    });
});

exports.deleteClass = catchAsync(async (req, res, next) => {
    assertValidObjectId(req.params.id, 'Invalid class id');

    const classDetail = await Class.findById(req.params.id);
    if (!classDetail) {
        return next(new AppError('Class not found', 404));
    }

    const enrolledStudents = await Enrollment.countDocuments({ class: req.params.id });
    if (enrolledStudents > 0) {
        return next(new AppError(`Cannot delete this class because it has ${enrolledStudents} enrolled students.`, 400));
    }

    await Class.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

exports.getClassStudents = catchAsync(async (req, res) => {
    assertValidObjectId(req.params.id, 'Invalid class id');

    const classDetail = await Class.findById(req.params.id).select('title maxStudents');
    if (!classDetail) {
        throw new AppError('Class not found', 404);
    }

    const enrollments = await Enrollment.find({ class: req.params.id })
        .sort({ enrolledAt: -1 })
        .populate('user', 'name email role isVerified createdAt');

    res.status(200).json({
        status: 'success',
        results: enrollments.length,
        data: {
            class: toClassResponse(classDetail, enrollments.length),
            students: enrollments.map((enrollment) => ({
                enrollmentId: enrollment._id,
                enrolledAt: enrollment.enrolledAt,
                user: enrollment.user,
            })),
        },
    });
});

exports.kickStudentFromClass = catchAsync(async (req, res) => {
    assertValidObjectId(req.params.id, 'Invalid class id');
    assertValidObjectId(req.params.userId, 'Invalid user id');

    const classDetail = await Class.findById(req.params.id).select('title');
    if (!classDetail) {
        throw new AppError('Class not found', 404);
    }

    const enrollment = await Enrollment.findOneAndDelete({
        class: req.params.id,
        user: req.params.userId,
    }).populate('user', 'name email role');

    if (!enrollment) {
        throw new AppError('Student is not enrolled in this class', 404);
    }

    res.status(200).json({
        status: 'success',
        message: 'Student removed from class successfully',
        data: {
            class: classDetail,
            removedStudent: enrollment.user,
        },
    });
});
