const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
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
        password: {
            type: String,
            required: function () { return !this.googleId; },
            select: false,
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true,
            select: false,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        avatar: { type: String, trim: true, default: '' },
        avatarPublicId: { type: String, select: false, default: '' },
        phone: { type: String, trim: true, maxlength: 30, default: '' },
        bio: { type: String, trim: true, maxlength: 500, default: '' },
        skillLevel: { type: String, enum: ['', 'beginner', 'intermediate', 'advanced'], default: '' },
        preferredCourt: { type: String, trim: true, maxlength: 150, default: '' },
        hasLocalPassword: { type: Boolean, default: true },
        passwordChangedAt: Date,
        passwordResetOtpHash: { type: String, select: false },
        passwordResetOtpExpires: { type: Date, select: false },
        passwordResetOtpAttempts: { type: Number, default: 0, select: false },
        isVerified: {
            type: Boolean,
            default: false,
        },
        // Store active session token hashes.
        activeTokens: [
            {
                tokenHash: {
                    type: String,
                    select: false,
                },
                createdAt: { type: Date, default: Date.now }
            }
        ],
    },
    { timestamps: true }
);

// Hash the password before saving.
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    if (!this.password) return;
    if (this.$locals.passwordAlreadyHashed) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Compare a candidate password during login.
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    if (!userPassword) return false;
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Check whether the password changed after a token was issued.
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTTimestamp < changedTimestamp;
    }

    return false;
};

module.exports = mongoose.model('User', userSchema);
