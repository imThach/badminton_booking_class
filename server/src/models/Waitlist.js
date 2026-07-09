const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
    class: { type: mongoose.Schema.ObjectId, ref: 'Class', required: true },
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
}, { timestamps: true });

waitlistSchema.index({ class: 1, user: 1 }, { unique: true });
waitlistSchema.index({ class: 1, joinedAt: 1 });

module.exports = mongoose.model('Waitlist', waitlistSchema);
