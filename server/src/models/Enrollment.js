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
});

// Prevent a user from enrolling in the same class twice at the database level.
enrollmentSchema.index({ class: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
