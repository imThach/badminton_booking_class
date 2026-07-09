const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    txnRef: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, index: true },
    class: { type: mongoose.Schema.ObjectId, ref: 'Class', required: true },
    enrollment: { type: mongoose.Schema.ObjectId, ref: 'Enrollment', required: true },
    amount: { type: Number, required: true, min: 1000 },
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refund_pending', 'refunded', 'refund_failed'],
        default: 'pending',
        index: true,
    },
    provider: { type: String, default: 'vnpay', enum: ['vnpay'] },
    providerTransactionNo: String,
    responseCode: String,
    bankCode: String,
    paidAt: Date,
    invoiceNumber: { type: String, unique: true, sparse: true },
    refundRequestedAt: Date,
    refundProcessedAt: Date,
    refundNote: { type: String, trim: true, maxlength: 500 },
    refundProcessedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
