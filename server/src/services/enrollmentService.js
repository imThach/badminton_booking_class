const mongoose = require('mongoose');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const AppError = require('../utils/appError');

const assertValidClassId = (classId) => {
    if (!mongoose.isValidObjectId(classId)) {
        throw new AppError('Invalid class id', 400);
    }
};

const addCurrentStudentsToEnrollment = async (enrollment) => {
    if (!enrollment || !enrollment.class) return enrollment;

    const enrollmentObject = enrollment.toObject ? enrollment.toObject() : enrollment;
    const classId = enrollmentObject.class._id || enrollmentObject.class;
    const currentStudents = await Enrollment.countDocuments({ class: classId });

    enrollmentObject.class = {
        ...enrollmentObject.class,
        currentStudents,
    };

    return enrollmentObject;
};

const addCurrentStudentsToEnrollments = async (enrollments) => {
    const classIds = enrollments
        .map((enrollment) => enrollment.class && enrollment.class._id)
        .filter(Boolean);

    const enrollmentCounts = await Enrollment.aggregate([
        { $match: { class: { $in: classIds } } },
        { $group: { _id: '$class', currentStudents: { $sum: 1 } } },
    ]);
    const countByClassId = new Map(
        enrollmentCounts.map((item) => [item._id.toString(), item.currentStudents])
    );

    return enrollments.map((enrollment) => {
        const enrollmentObject = enrollment.toObject ? enrollment.toObject() : enrollment;

        if (enrollmentObject.class && enrollmentObject.class._id) {
            enrollmentObject.class.currentStudents =
                countByClassId.get(enrollmentObject.class._id.toString()) || 0;
        }

        return enrollmentObject;
    });
};

exports.enrollClass = async ({ classId, userId }) => {
    assertValidClassId(classId);

    const classDetail = await Class.findById(classId);
    if (!classDetail) {
        throw new AppError('Class not found', 404);
    }

    if (classDetail.startDate < new Date()) {
        throw new AppError('Cannot enroll in a class that has already started', 400);
    }

    const existingEnrollment = await Enrollment.findOne({
        class: classId,
        user: userId,
    });

    if (existingEnrollment) {
        throw new AppError('You have already enrolled in this class', 409);
    }

    const currentStudents = await Enrollment.countDocuments({ class: classId });
    if (currentStudents >= classDetail.maxStudents) {
        throw new AppError('This class is full', 400);
    }

    try {
        const enrollment = await Enrollment.create({
            class: classId,
            user: userId,
        });

        const populatedEnrollment = await Enrollment.findById(enrollment._id)
            .populate('class')
            .populate('user', 'name email role');

        return addCurrentStudentsToEnrollment(populatedEnrollment);
    } catch (error) {
        if (error.code === 11000) {
            throw new AppError('You have already enrolled in this class', 409);
        }

        throw error;
    }
};

exports.cancelEnrollment = async ({ classId, userId }) => {
    assertValidClassId(classId);

    const enrollment = await Enrollment.findOneAndDelete({
        class: classId,
        user: userId,
    }).populate('class');

    if (!enrollment) {
        throw new AppError('Enrollment not found', 404);
    }

    return addCurrentStudentsToEnrollment(enrollment);
};

exports.getMyEnrollments = async (userId) => {
    const enrollments = await Enrollment.find({ user: userId })
        .sort({ enrolledAt: -1 })
        .populate({
            path: 'class',
            populate: {
                path: 'createdBy',
                select: 'name email role',
            },
        });

    return addCurrentStudentsToEnrollments(enrollments);
};
