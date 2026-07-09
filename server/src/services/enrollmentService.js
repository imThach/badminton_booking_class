const mongoose = require('mongoose');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const EnrollmentCancellation = require('../models/EnrollmentCancellation');
const Payment = require('../models/Payment');
const notificationService = require('./notificationService');
const AppError = require('../utils/appError');
const CANCEL_ENROLLMENT_GUARD_MS = 2 * 60 * 1000;
const occupyingStatusFilter = { $or: [{ status: { $in: ['active', 'pending_payment'] } }, { status: { $exists: false } }] };
const activeStatusFilter = { $or: [{ status: 'active' }, { status: { $exists: false } }] };

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
    const currentStudents = await Enrollment.countDocuments({
        class: classId,
        ...occupyingStatusFilter,
    }).session(session);
    return Class.findByIdAndUpdate(
        classId,
        { currentStudents },
        { new: true, runValidators: true, session }
    );
};

exports.enrollClass = async ({ classId, userId, status = 'active' }) => {
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

    if (existingEnrollment && existingEnrollment.status !== 'cancelled') {
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
        let enrollment;
        if (existingEnrollment?.status === 'cancelled') {
            existingEnrollment.status = status;
            existingEnrollment.enrolledAt = new Date();
            existingEnrollment.cancelledAt = undefined;
            existingEnrollment.cancellationReason = undefined;
            existingEnrollment.refundEligible = false;
            enrollment = await existingEnrollment.save();
        } else {
            enrollment = await Enrollment.create({
                class: classId,
                user: userId,
                status,
            });
        }

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
    let cancellationNotification;

    try {
        await session.withTransaction(async () => {
            const enrollment = await Enrollment.findOne({
                class: classId,
                user: userId,
                ...activeStatusFilter,
            }).session(session).populate('class').populate('user', 'name email');

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

            const refundEligible = enrollment.class.startDate.getTime() - Date.now() >= 24 * 60 * 60 * 1000;
            enrollment.status = 'cancelled';
            enrollment.cancelledAt = new Date();
            enrollment.cancellationReason = 'Cancelled by user';
            enrollment.refundEligible = refundEligible;
            await enrollment.save({ session });

            let refundStatus = 'not_applicable';
            const payment = await Payment.findOne({ enrollment: enrollment._id, status: 'paid' })
                .sort({ paidAt: -1 })
                .session(session);
            if (refundEligible && payment?.status === 'paid') {
                payment.status = 'refund_pending';
                payment.refundRequestedAt = new Date();
                await payment.save({ session });
                refundStatus = 'refund_pending';
            } else if (payment) {
                refundStatus = payment.status;
            }

            await createCancellationGuard({ classId, userId, session });
            const updatedClass = await syncClassCurrentStudents(classId, session);
            const enrollmentResponse = toEnrollmentResponse(enrollment);
            if (updatedClass) {
                enrollmentResponse.class = updatedClass;
            }
            enrollmentResponse.refundStatus = refundStatus;
            enrollmentResponse.refundEligible = refundEligible;

            result = enrollmentResponse;
            cancellationNotification = {
                user: enrollment.user,
                classDetail: enrollment.class,
                cancelledAt: enrollment.cancelledAt,
                refundEligible,
                refundStatus,
            };
        });
    } finally {
        await session.endSession();
    }

    if (cancellationNotification) {
        void notificationService.sendCancellationNotification(cancellationNotification).catch((error) => {
            console.error('Could not send cancellation confirmation email:', error.message);
        });
    }

    return result;
};

exports.getMyEnrollments = async (userId) => {
    const enrollments = await Enrollment.find({ user: userId, ...activeStatusFilter })
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
