const paymentService = require('../services/paymentService');
const invoicePdfService = require('../services/invoicePdfService');
const catchAsync = require('../utils/catchAsync');
const sendResponse = require('../utils/sendResponse');
const AppError = require('../utils/appError');
const auditService = require('../services/auditService');

const clientUrl = () => String(process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');

exports.createVnpayPayment = catchAsync(async (req, res) => {
    const result = await paymentService.createPayment({
        classId: req.params.classId,
        userId: req.user.id,
        ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress,
    });
    sendResponse(res, 201, 'Payment created', { paymentUrl: result.paymentUrl, paymentId: result.payment._id });
});

exports.vnpayReturn = catchAsync(async (req, res) => {
    try {
        const payment = await paymentService.processResult(req.query);
        res.redirect(`${clientUrl()}/payment-result?status=${payment.status}&paymentId=${payment._id}`);
    } catch (error) {
        res.redirect(`${clientUrl()}/payment-result?status=error`);
    }
});

exports.vnpayIpn = async (req, res) => {
    try {
        await paymentService.processResult(req.query);
        res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
    } catch (error) {
        const code = error.statusCode === 404 ? '01' : error.message.includes('amount') ? '04' : '97';
        res.status(200).json({ RspCode: code, Message: error.message });
    }
};

exports.getMyPayments = catchAsync(async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const result = await paymentService.getMyPayments(req.user.id, { page, limit });
    sendResponse(res, 200, 'Payments retrieved', result);
});

exports.getPaymentStatus = catchAsync(async (req, res) => {
    const payment = await paymentService.getPaymentStatus(req.params.paymentId, req.user.id);
    if (!payment) throw new AppError('Payment not found', 404);

    sendResponse(res, 200, 'Payment status retrieved', { payment });
});

exports.getAdminPaymentHistory = catchAsync(async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const allowedStatuses = ['pending', 'paid', 'failed', 'refund_pending', 'refunded', 'refund_failed'];
    if (req.query.status && !allowedStatuses.includes(req.query.status)) throw new AppError('Invalid payment status', 400);
    const result = await paymentService.getAdminPaymentHistory({ page, limit, status: req.query.status });
    sendResponse(res, 200, 'Payment history retrieved', result);
});

exports.getRefundRequests = catchAsync(async (req, res) => {
    const payments = await paymentService.getRefundRequests();
    sendResponse(res, 200, 'Refund requests retrieved', { payments });
});

exports.processRefund = catchAsync(async (req, res) => {
    const payment = await paymentService.processRefund({
        paymentId: req.params.paymentId,
        adminId: req.user.id,
        action: req.body.action,
        note: req.body.note,
    });
    await auditService.writeAuditLog({ req, action: 'REFUND_STATUS_CHANGED', targetType: 'Payment', targetId: payment._id, changes: { status: payment.status }, metadata: { txnRef: payment.txnRef } });
    sendResponse(res, 200, 'Refund status updated', { payment });
});

exports.downloadInvoice = catchAsync(async (req, res) => {
    const payment = await paymentService.getPaymentForInvoice(req.params.paymentId, req.user.id);
    if (!payment) throw new AppError('Paid invoice not found', 404);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${payment.invoiceNumber}.pdf"`);

    const doc = invoicePdfService.createInvoiceDocument(payment, res);
    doc.end();
});
