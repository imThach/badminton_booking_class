const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const NotificationLog = require('../models/NotificationLog');
const { sendEnrollmentConfirmation, sendPaymentConfirmation, sendClassReminder } = require('../emails/classNotificationEmail');
const sendCancellationConfirmation = require('../emails/cancellationNotificationEmail');

const sendOnce = async ({ enrollmentId, type, send }) => {
    try {
        await NotificationLog.create({ enrollment: enrollmentId, type });
    } catch (error) {
        if (error.code === 11000) return false;
        throw error;
    }
    try {
        await send();
        return true;
    } catch (error) {
        await NotificationLog.deleteOne({ enrollment: enrollmentId, type });
        throw error;
    }
};

exports.sendPaymentNotifications = async (paymentId) => {
    const payment = await Payment.findById(paymentId)
        .populate('user', 'name email')
        .populate('class', 'title coachName startDate schedule location');
    if (!payment || payment.status !== 'paid' || !payment.user || !payment.class) return;
    const results = await Promise.allSettled([
        sendOnce({ enrollmentId: payment.enrollment, type: 'payment_confirmation', send: () => sendPaymentConfirmation({ user: payment.user, classDetail: payment.class, payment }) }),
        sendOnce({ enrollmentId: payment.enrollment, type: 'enrollment_confirmation', send: () => sendEnrollmentConfirmation({ user: payment.user, classDetail: payment.class }) }),
    ]);
    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length) throw failures[0].reason;
};

exports.sendDueClassReminders = async () => {
    const now = new Date();
    const enrollments = await Enrollment.find({
        $or: [{ status: 'active' }, { status: { $exists: false } }],
    }).populate({ path: 'class', match: { startDate: { $gt: now, $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) } } })
        .populate('user', 'name email');

    for (const enrollment of enrollments) {
        if (!enrollment.class || !enrollment.user?.email) continue;
        const remainingMs = enrollment.class.startDate.getTime() - now.getTime();
        if (remainingMs > 23 * 60 * 60 * 1000) {
            await sendOnce({ enrollmentId: enrollment._id, type: 'class_reminder_24h', send: () => sendClassReminder({ user: enrollment.user, classDetail: enrollment.class, hours: 24 }) });
        }
        if (remainingMs <= 60 * 60 * 1000) {
            await sendOnce({ enrollmentId: enrollment._id, type: 'class_reminder_1h', send: () => sendClassReminder({ user: enrollment.user, classDetail: enrollment.class, hours: 1 }) });
        }
    }
};

exports.sendCancellationNotification = ({ user, classDetail, cancelledAt, refundEligible, refundStatus }) => {
    if (!user?.email || !classDetail) return Promise.resolve(false);
    return sendCancellationConfirmation({ user, classDetail, cancelledAt, refundEligible, refundStatus });
};
