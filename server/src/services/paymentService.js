const crypto = require('crypto');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const AppError = require('../utils/appError');
const enrollmentService = require('./enrollmentService');
const notificationService = require('./notificationService');

const PAYMENT_HOLD_MS = 15 * 60 * 1000;

const pad = (value) => String(value).padStart(2, '0');
const vnpDate = (date = new Date()) => {
    const local = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    return `${local.getUTCFullYear()}${pad(local.getUTCMonth() + 1)}${pad(local.getUTCDate())}${pad(local.getUTCHours())}${pad(local.getUTCMinutes())}${pad(local.getUTCSeconds())}`;
};

// VNPAY 2.1.0 signs already-encoded values and represents spaces as "+".
// Keep this identical for payment creation, Return URL and IPN verification.
const encodedQuery = (params) => Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map(encodeURIComponent)
    .sort()
    .map((encodedKey) => {
        const encodedValue = encodeURIComponent(String(params[encodedKey])).replace(/%20/g, '+');
        return `${encodedKey}=${encodedValue}`;
    })
    .join('&');

const assertConfig = () => {
    if (!process.env.VNPAY_TMN_CODE || !process.env.VNPAY_HASH_SECRET) {
        throw new AppError('VNPAY is not configured', 500);
    }
};

const sign = (params) => crypto
    .createHmac('sha512', process.env.VNPAY_HASH_SECRET)
    .update(encodedQuery(params), 'utf8')
    .digest('hex');

exports.verifyVnpaySignature = (query) => {
    assertConfig();
    const { vnp_SecureHash, vnp_SecureHashType, ...params } = query;
    if (!vnp_SecureHash) return false;
    const expected = sign(params);
    const actualBuffer = Buffer.from(String(vnp_SecureHash).toLowerCase());
    const expectedBuffer = Buffer.from(expected.toLowerCase());
    return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
};

const buildPaymentUrl = ({ payment, ipAddress }) => {
    const returnUrl = process.env.VNPAY_RETURN_URL || `${String(process.env.SERVER_URL || 'http://localhost:3001').replace(/\/$/, '')}/api/v1/payments/vnpay/return`;
    const createDate = vnpDate();
    const expireDate = vnpDate(new Date(Date.now() + PAYMENT_HOLD_MS));
    const params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: process.env.VNPAY_TMN_CODE,
        vnp_Amount: payment.amount * 100,
        vnp_CurrCode: 'VND',
        vnp_TxnRef: payment.txnRef,
        vnp_OrderInfo: `Thanh toan lop hoc ${payment.class}`,
        vnp_OrderType: 'other',
        vnp_Locale: 'vn',
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddress || '127.0.0.1',
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate,
    };
    const secureHash = sign(params);
    const baseUrl = process.env.VNPAY_PAYMENT_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    return `${baseUrl}?${encodedQuery({ ...params, vnp_SecureHash: secureHash })}`;
};

const cancelPendingEnrollment = async ({ enrollmentId, classId, reason }) => {
    const cancelled = await Enrollment.findOneAndUpdate(
        { _id: enrollmentId, status: 'pending_payment' },
        {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancellationReason: reason,
            refundEligible: false,
        },
        { new: true }
    );
    if (cancelled) {
        await Class.findOneAndUpdate(
            { _id: classId, currentStudents: { $gt: 0 } },
            { $inc: { currentStudents: -1 } }
        );
    }
};

const releaseExpiredPayments = async () => {
    const expired = await Payment.find({
        status: 'pending',
        createdAt: { $lt: new Date(Date.now() - PAYMENT_HOLD_MS) },
    });
    for (const payment of expired) {
        await cancelPendingEnrollment({ enrollmentId: payment.enrollment, classId: payment.class, reason: 'Payment expired' });
        payment.status = 'failed';
        payment.responseCode = 'EXPIRED';
        await payment.save();
    }
};

exports.createPayment = async ({ classId, userId, ipAddress }) => {
    assertConfig();
    await releaseExpiredPayments();
    const classDetail = await Class.findById(classId);
    if (!classDetail) throw new AppError('Class not found', 404);

    const existing = await Payment.findOne({ user: userId, class: classId, status: 'pending' });
    if (existing) return { payment: existing, paymentUrl: buildPaymentUrl({ payment: existing, ipAddress }) };

    const enrollment = await enrollmentService.enrollClass({ classId, userId, status: 'pending_payment' });
    try {
        const payment = await Payment.create({
            txnRef: `${Date.now()}${crypto.randomBytes(4).toString('hex')}`,
            user: userId,
            class: classId,
            enrollment: enrollment._id,
            amount: Number(classDetail.price || 250000),
        });
        return { payment, paymentUrl: buildPaymentUrl({ payment, ipAddress }) };
    } catch (error) {
        await cancelPendingEnrollment({ enrollmentId: enrollment._id, classId, reason: 'Could not create payment' });
        throw error;
    }
};

exports.processResult = async (query) => {
    if (!exports.verifyVnpaySignature(query)) throw new AppError('Invalid VNPAY signature', 400);
    const payment = await Payment.findOne({ txnRef: query.vnp_TxnRef });
    if (!payment) throw new AppError('Payment not found', 404);
    if (Number(query.vnp_Amount) !== payment.amount * 100) throw new AppError('Invalid payment amount', 400);
    if (payment.status !== 'pending') return payment;

    const isPaid = query.vnp_ResponseCode === '00' && (!query.vnp_TransactionStatus || query.vnp_TransactionStatus === '00');
    payment.responseCode = query.vnp_ResponseCode;
    payment.providerTransactionNo = query.vnp_TransactionNo;
    payment.bankCode = query.vnp_BankCode;

    if (isPaid) {
        payment.status = 'paid';
        payment.paidAt = new Date();
        payment.invoiceNumber = `INV-${new Date().getFullYear()}-${payment.txnRef}`;
        await Enrollment.findByIdAndUpdate(payment.enrollment, { status: 'active', enrolledAt: new Date() });
    } else {
        payment.status = 'failed';
        await cancelPendingEnrollment({ enrollmentId: payment.enrollment, classId: payment.class, reason: 'Payment failed or was cancelled' });
    }
    await payment.save();
    if (isPaid) {
        notificationService.sendPaymentNotifications(payment._id).catch((error) => console.error('Payment notification failed:', error.message));
    }
    return payment;
};

exports.getMyPayments = (userId) => Payment.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate('class', 'title coachName schedule startDate location price');

exports.getAdminPaymentHistory = async ({ page = 1, limit = 20, status }) => {
    const filter = status ? { status } : {};
    const [payments, total] = await Promise.all([
        Payment.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('class', 'title startDate endDate')
            .populate('user', 'name email'),
        Payment.countDocuments(filter),
    ]);
    return { payments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

exports.getPaymentForInvoice = (paymentId, userId) => Payment.findOne({
    _id: paymentId,
    user: userId,
    status: { $in: ['paid', 'refund_pending', 'refunded', 'refund_failed'] },
})
    .populate('class', 'title coachName schedule startDate location')
    .populate('user', 'name email');

exports.getRefundRequests = async () => {
    return Payment.find({
        status: { $in: ['refund_pending', 'refunded', 'refund_failed'] },
    })
        .sort({ refundRequestedAt: -1 })
        .populate('class', 'title startDate')
        .populate('user', 'name email')
        .lean();
};

exports.processRefund = async ({ paymentId, adminId, action, note }) => {
    if (!['refunded', 'refund_failed'].includes(action)) {
        throw new AppError('Refund action must be refunded or refund_failed', 400);
    }
    const payment = await Payment.findOne({ _id: paymentId, status: 'refund_pending' });
    if (!payment) throw new AppError('Pending refund request not found', 404);
    payment.status = action;
    payment.refundProcessedAt = new Date();
    payment.refundProcessedBy = adminId;
    payment.refundNote = String(note || '').trim();
    await payment.save();
    return payment;
};
