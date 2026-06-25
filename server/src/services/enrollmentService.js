const mongoose = require('mongoose');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const AppError = require('../utils/appError');
const { syncClassCurrentStudents } = require('./classService');

const assertValidClassId = (classId) => {
    if (!mongoose.isValidObjectId(classId)) {
        throw new AppError('Invalid class id', 400);
    }
};

const toEnrollmentResponse = (enrollment) => {
    if (!enrollment || !enrollment.class) return enrollment;

    const enrollmentObject = enrollment.toObject ? enrollment.toObject() : enrollment;
    return enrollmentObject;
};

const toEnrollmentResponses = (enrollments) => enrollments.map(toEnrollmentResponse);

const releaseReservedSlot = async (classId) => {
    await Class.findOneAndUpdate(
        {
            _id: classId,
            currentStudents: { $gt: 0 },
        },
        { $inc: { currentStudents: -1 } },
        { runValidators: true }
    );
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

    const reservedClass = await Class.findOneAndUpdate(
        {
            _id: classId,
            $expr: { $lt: [{ $ifNull: ['$currentStudents', 0] }, '$maxStudents'] },
        },
        { $inc: { currentStudents: 1 } },
        { new: true, runValidators: true }
    );

    if (!reservedClass) {
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

        return toEnrollmentResponse(populatedEnrollment);
    } catch (error) {
        await releaseReservedSlot(classId);
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

    const updatedClass = await syncClassCurrentStudents(classId);
    const enrollmentResponse = toEnrollmentResponse(enrollment);
    if (updatedClass) {
        enrollmentResponse.class = updatedClass;
    }

    return enrollmentResponse;
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

    return toEnrollmentResponses(enrollments);
};
