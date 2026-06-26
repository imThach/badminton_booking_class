const mongoose = require('mongoose');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const EnrollmentCancellation = require('../models/EnrollmentCancellation');
const AppError = require('../utils/appError');
const CANCEL_ENROLLMENT_GUARD_MS = 2 * 60 * 1000;

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

const createCancellationGuard = async ({ classId, userId, session }) => {
    await EnrollmentCancellation.findOneAndUpdate(
        { class: classId, user: userId },
        { expiresAt: new Date(Date.now() + CANCEL_ENROLLMENT_GUARD_MS) },
        { upsert: true, setDefaultsOnInsert: true, session }
    );
};

const assertNoRecentCancellation = async ({ classId, userId }) => {
    const cancellation = await EnrollmentCancellation.findOne({
        class: classId,
        user: userId,
        expiresAt: { $gt: new Date() },
    });
    if (cancellation) {
        throw new AppError('Your cancellation is still being processed. Please refresh before enrolling again.', 409);
    }
};

const hasRecentCancellation = async ({ classId, userId, session }) => {
    const cancellation = await EnrollmentCancellation.exists({
        class: classId,
        user: userId,
        expiresAt: { $gt: new Date() },
    }).session(session);

    return !!cancellation;
};

const syncClassCurrentStudents = async (classId, session) => {
    const currentStudents = await Enrollment.countDocuments({ class: classId }).session(session);
    return Class.findByIdAndUpdate(
        classId,
        { currentStudents },
        { new: true, runValidators: true, session }
    );
};

exports.enrollClass = async ({ classId, userId }) => {
    assertValidClassId(classId);

    const now = new Date();
    const classDetail = await Class.findById(classId);
    if (!classDetail) {
        throw new AppError('Class not found', 404);
    }

    if (classDetail.startDate <= now) {
        throw new AppError('Cannot enroll in a class that has already started', 400);
    }

    await assertNoRecentCancellation({ classId, userId });
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
            startDate: { $gt: now },
            $expr: { $lt: [{ $ifNull: ['$currentStudents', 0] }, '$maxStudents'] },
        },
        { $inc: { currentStudents: 1 } },
        { new: true, runValidators: true }
    );

    if (!reservedClass) {
        const latestClass = await Class.findById(classId);
        if (!latestClass) {
            throw new AppError('Class not found', 404);
        }

        if (latestClass?.startDate <= new Date()) {
            throw new AppError('Cannot enroll in a class that has already started', 400);
        }
        throw new AppError('This class is full', 400);
    }

    try {
        await assertNoRecentCancellation({ classId, userId });
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

    const session = await mongoose.startSession();
    let result;

    try {
        await session.withTransaction(async () => {
            const enrollment = await Enrollment.findOneAndDelete({
                class: classId,
                user: userId,
            }).session(session).populate('class');

            if (!enrollment) {
                if (await hasRecentCancellation({ classId, userId, session })) {
                    throw new AppError('This enrollment no longer exists.', 404);
                }

                const classDetail = await Class.findById(classId).session(session);
                if (!classDetail) {
                    throw new AppError('Class not found', 404);
                }

                await createCancellationGuard({ classId, userId, session });
                const updatedClass = await syncClassCurrentStudents(classId, session);

                result = {
                    class: updatedClass || classDetail,
                    alreadyRemoved: true,
                };
                return;
            }

            await createCancellationGuard({ classId, userId, session });
            const updatedClass = await syncClassCurrentStudents(classId, session);
            const enrollmentResponse = toEnrollmentResponse(enrollment);
            if (updatedClass) {
                enrollmentResponse.class = updatedClass;
            }

            result = enrollmentResponse;
        });
    } finally {
        await session.endSession();
    }

    return result;
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
