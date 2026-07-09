const mongoose = require('mongoose');

const coachSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 100 },
        photo: { type: String, trim: true, default: '' },
        bio: { type: String, trim: true, default: '', maxlength: 2000 },
        isActive: { type: Boolean, default: true },
        createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

coachSchema.index({ name: 1 });

module.exports = mongoose.model('Coach', coachSchema);
