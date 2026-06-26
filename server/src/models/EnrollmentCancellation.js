const mongoose = require('mongoose');

const enrollmentCancellationSchema = new mongoose.Schema(
    {
        class: {
            type: mongoose.Schema.ObjectId,
            ref: 'Class',
            required: [true, 'Enrollment cancellation must belong to a class'],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Enrollment cancellation must belong to a user'],
        },
        expiresAt: {
            type: Date,
            required: true,
            expires: 0,
        },
    },
    { timestamps: true }
);

enrollmentCancellationSchema.index({ class: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('EnrollmentCancellation', enrollmentCancellationSchema);
