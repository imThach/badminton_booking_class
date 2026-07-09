const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
    enrollment: { type: mongoose.Schema.ObjectId, ref: 'Enrollment', required: true },
    type: {
        type: String,
        enum: ['enrollment_confirmation', 'payment_confirmation', 'class_reminder_24h', 'class_reminder_1h'],
        required: true,
    },
    sentAt: { type: Date, default: Date.now },
}, { timestamps: true });

notificationLogSchema.index({ enrollment: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
