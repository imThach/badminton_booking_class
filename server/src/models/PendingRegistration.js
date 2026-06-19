const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const pendingRegistrationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please enter your full name'],
        },
        email: {
            type: String,
            required: [true, 'Please enter your email address'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        otpHash: {
            type: String,
            required: true,
            select: false,
        },
        otpExpires: {
            type: Date,
            required: true,
            index: { expires: 0 },
        },
        attempts: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

pendingRegistrationSchema.pre('save', async function () {
    if (this.isModified('passwordHash') && !this.passwordHash.startsWith('$2')) {
        this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    }
});

pendingRegistrationSchema.statics.hashOTP = function (otp) {
    return crypto.createHash('sha256').update(String(otp)).digest('hex');
};

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);
