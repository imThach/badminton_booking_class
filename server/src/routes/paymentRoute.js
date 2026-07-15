const express = require('express');
const paymentController = require('../controllers/paymentController');
const mongoose = require('mongoose');
const AppError = require('../utils/appError');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const enrollmentValidator = require('../validators/enrollmentValidator');

const router = express.Router();

router.get('/vnpay/return', paymentController.vnpayReturn);
router.get('/vnpay/ipn', paymentController.vnpayIpn);
router.use(protect);
router.get('/admin/refunds', restrictTo('admin'), paymentController.getRefundRequests);
router.get('/admin/history', restrictTo('admin'), paymentController.getAdminPaymentHistory);
router.patch('/admin/refunds/:paymentId', restrictTo('admin'), (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.paymentId)) return next(new AppError('Invalid payment id', 400));
    if (Object.keys(req.body || {}).some((field) => !['action', 'note'].includes(field))) return next(new AppError('Refund payload contains an invalid field', 400));
    if (!['refunded', 'refund_failed'].includes(req.body.action)) return next(new AppError('Invalid refund action', 400));
    if (req.body.note !== undefined && String(req.body.note).trim().length > 500) return next(new AppError('note cannot exceed 500 characters', 400));
    return next();
}, paymentController.processRefund);
router.get('/me', paymentController.getMyPayments);
router.get('/:paymentId/status', (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.paymentId)) return next(new AppError('Invalid payment id', 400));
    return next();
}, paymentController.getPaymentStatus);
router.get('/:paymentId/invoice', paymentController.downloadInvoice);
router.post('/vnpay/classes/:classId', restrictTo('user'), enrollmentValidator.validateClassIdParam, paymentController.createVnpayPayment);

module.exports = router;
