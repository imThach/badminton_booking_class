const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
    class: {
        type: mongoose.Schema.ObjectId,
        ref: 'Class',
        required: [true, 'Enrollment must belong to a class'],
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Enrollment must belong to a user'],
    },
    enrolledAt: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['pending_payment', 'active', 'cancelled'],
        default: 'active',
        index: true,
    },
    cancelledAt: Date,
    cancellationReason: { type: String, trim: true, maxlength: 500 },
    refundEligible: { type: Boolean, default: false },
});

// Prevent a user from enrolling in the same class twice at the database level.
enrollmentSchema.index({ class: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
