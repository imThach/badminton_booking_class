const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const AppError = require('../utils/appError');
const { sendSignupOTP } = require('../emails/signupOtpEmail');
const { sendPasswordResetOTP } = require('../emails/passwordResetOtpEmail');

const OTP_EXPIRES_IN_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const DEFAULT_ACTIVE_TOKEN_LIMIT = 5;
const DEFAULT_JWT_EXPIRES_IN = '1d';

const getActiveTokenLimit = () =>
    Math.max(Number(process.env.MAX_ACTIVE_TOKENS_PER_USER) || DEFAULT_ACTIVE_TOKEN_LIMIT, 1);

const getTokenRetentionDate = () => {
    const cookieDays = Number(process.env.JWT_COOKIE_EXPIRES_IN) || 30;
    return new Date(Date.now() - cookieDays * 24 * 60 * 60 * 1000);
};

const pruneActiveTokens = (activeTokens = []) =>
    activeTokens
        .filter((tokenRecord) => tokenRecord.createdAt >= getTokenRetentionDate())
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, getActiveTokenLimit());

const assertJwtConfig = () => {
    if (!process.env.JWT_SECRET) {
        throw new AppError('JWT_SECRET is not configured', 500);
    }

    if (process.env.JWT_SECRET.length < 32) {
        throw new AppError('JWT_SECRET must be at least 32 characters', 500);
    }
};

const getJwtExpiresIn = () => {
    const configuredValue = process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN;
    const normalizedValue = String(configuredValue).trim();

    if (!normalizedValue) {
        return DEFAULT_JWT_EXPIRES_IN;
    }

    if (/^\d+$/.test(normalizedValue)) {
        return `${normalizedValue}d`;
    }

    return normalizedValue;
};

// Validate JWT config when the module loads.
assertJwtConfig();

const signToken = (user) =>
    jwt.sign(
        {
            id: user._id,
            role: user.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: getJwtExpiresIn(),
        }
    );

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

exports.hashToken = hashToken;

const sanitizeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    avatar: user.avatar || '',
    phone: user.phone || '',
    bio: user.bio || '',
    skillLevel: user.skillLevel || '',
    preferredCourt: user.preferredCourt || '',
    hasLocalPassword: user.hasLocalPassword !== false,
});

exports.sanitizeUser = sanitizeUser;

const createOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.signup = async ({ name, email, password, role, adminInviteCode }) => {
    if (!name || !email || !password) {
        throw new AppError('Please provide name, email and password', 400);
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
        throw new AppError('Email is already in use', 409);
    }

    const requestedRole = role === 'admin' ? 'admin' : 'user';
    if (requestedRole === 'admin' && (!process.env.ADMIN_INVITE_CODE || adminInviteCode !== process.env.ADMIN_INVITE_CODE)) {
        throw new AppError('Invalid admin invite code', 403);
    }

    const otp = createOTP();
    const pending = await PendingRegistration.findOne({ email: normalizedEmail });

    if (pending) {
        pending.name = name;
        pending.passwordHash = password;
        pending.role = requestedRole;
        pending.otpHash = PendingRegistration.hashOTP(otp);
        pending.otpExpires = new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);
        pending.attempts = 0;
        await pending.save();
    } else {
        await PendingRegistration.create({
            name,
            email: normalizedEmail,
            passwordHash: password,
            role: requestedRole,
            otpHash: PendingRegistration.hashOTP(otp),
            otpExpires: new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000),
        });
    }

    try {
        await sendSignupOTP({
            email: normalizedEmail,
            name,
            otp,
            expiresInMinutes: OTP_EXPIRES_IN_MINUTES,
        });
    } catch (error) {
        await PendingRegistration.deleteOne({ email: normalizedEmail });
        throw new AppError(`Could not send OTP email: ${error.message}`, 500);
    }

    return {
        email: normalizedEmail,
        otpExpiresInMinutes: OTP_EXPIRES_IN_MINUTES,
    };
};

exports.verifySignupOTP = async ({ email, otp }) => {
    if (!email || !otp) {
        throw new AppError('Please provide email and OTP', 400);
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const pending = await PendingRegistration.findOne({ email: normalizedEmail }).select('+passwordHash +otpHash');

    if (!pending) {
        throw new AppError('No pending registration found for this email', 404);
    }

    if (pending.otpExpires.getTime() < Date.now()) {
        await PendingRegistration.deleteOne({ _id: pending._id });
        throw new AppError('OTP has expired. Please sign up again', 400);
    }

    if (pending.attempts >= MAX_OTP_ATTEMPTS) {
        await PendingRegistration.deleteOne({ _id: pending._id });
        throw new AppError('Too many invalid OTP attempts. Please sign up again', 429);
    }

    if (PendingRegistration.hashOTP(otp) !== pending.otpHash) {
        pending.attempts += 1;
        await pending.save();
        throw new AppError('Invalid OTP', 400);
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
        await PendingRegistration.deleteOne({ _id: pending._id });
        throw new AppError('Email is already in use', 409);
    }

    const user = new User({
        name: pending.name,
        email: pending.email,
        password: pending.passwordHash,
        role: pending.role,
        isVerified: true,
    });
    user.$locals.passwordAlreadyHashed = true;
    await user.save();
    await PendingRegistration.deleteOne({ _id: pending._id });

    return {
        user: sanitizeUser(user),
    };
};

exports.resendSignupOTP = async ({ email }) => {
    if (!email) {
        throw new AppError('Please provide email', 400);
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const pending = await PendingRegistration.findOne({ email: normalizedEmail });

    if (!pending) {
        throw new AppError('No pending registration found for this email', 404);
    }

    if (pending.attempts >= MAX_OTP_ATTEMPTS) {
        await PendingRegistration.deleteOne({ _id: pending._id });
        throw new AppError('Too many invalid OTP attempts. Please sign up again', 429);
    }

    const otp = createOTP();
    pending.otpHash = PendingRegistration.hashOTP(otp);
    pending.otpExpires = new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);
    await pending.save();

    await sendSignupOTP({
        email: pending.email,
        name: pending.name,
        otp,
        expiresInMinutes: OTP_EXPIRES_IN_MINUTES,
    });

    return {
        email: pending.email,
        otpExpiresInMinutes: OTP_EXPIRES_IN_MINUTES,
    };
};

exports.login = async ({ email, password }) => {
    if (!email || !password) {
        throw new AppError('Please provide email and password', 400);
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
    if (!user || !user.password || !(await user.correctPassword(password, user.password))) {
        throw new AppError('Incorrect email or password', 401);
    }

    if (!user.isVerified) {
        throw new AppError('Please verify your email before logging in', 403);
    }

    const token = signToken(user);
    user.activeTokens = pruneActiveTokens([
        ...user.activeTokens,
        { tokenHash: hashToken(token), createdAt: new Date() },
    ]);
    await user.save({ validateBeforeSave: false });

    return {
        token,
        user: sanitizeUser(user),
    };
};

exports.logout = async (userId, token) => {
    await User.findByIdAndUpdate(userId, {
        $pull: { activeTokens: { tokenHash: hashToken(token) } }
    });
};

exports.pruneExpiredActiveTokens = async (user) => {
    const prunedTokens = pruneActiveTokens(user.activeTokens);

    if (prunedTokens.length !== user.activeTokens.length) {
        user.activeTokens = prunedTokens;
        await user.save({ validateBeforeSave: false });
    }
};

exports.loginWithGoogle = async ({ googleId, email, name, avatar }, { createIfMissing = false } = {}) => {
    if (!googleId || !email) {
        throw new AppError('Google did not return the required account information', 400);
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    let user = createIfMissing
        ? await User.findOne({ $or: [{ googleId }, { email: normalizedEmail }] }).select('+googleId +password')
        : await User.findOne({ googleId }).select('+googleId +password');

    if (!user && !createIfMissing) return null;

    if (user?.googleId && user.googleId !== googleId) {
        throw new AppError('This email is already linked to another Google account', 409);
    }

    if (!user) {
        user = await User.create({
            name: String(name || normalizedEmail.split('@')[0]).trim(),
            email: normalizedEmail,
            googleId,
            avatar: avatar || '',
            isVerified: true,
            hasLocalPassword: false,
        });
    } else {
        user.googleId = googleId;
        user.isVerified = true;
        user.hasLocalPassword = Boolean(user.password);
        if (!user.avatar && avatar) user.avatar = avatar;
    }

    const token = signToken(user);
    user.activeTokens = pruneActiveTokens([
        ...user.activeTokens,
        { tokenHash: hashToken(token), createdAt: new Date() },
    ]);
    await user.save({ validateBeforeSave: false });

    return {
        token,
        user: sanitizeUser(user),
    };
};

exports.updateProfile = async (userId, { name, phone, bio, skillLevel, preferredCourt }) => {
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (phone !== undefined) updates.phone = String(phone).trim();
    if (bio !== undefined) updates.bio = String(bio).trim();
    if (skillLevel !== undefined) updates.skillLevel = String(skillLevel).trim().toLowerCase();
    if (preferredCourt !== undefined) updates.preferredCourt = String(preferredCourt).trim();
    if (!updates.name && name !== undefined) throw new AppError('Name is required', 400);
    const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
    return sanitizeUser(user);
};

exports.updateAvatar = async (userId, { avatar, avatarPublicId }) => {
    const previousUser = await User.findById(userId).select('+avatarPublicId');
    if (!previousUser) throw new AppError('User not found', 404);
    const previousPublicId = previousUser.avatarPublicId || '';
    previousUser.avatar = avatar || '';
    previousUser.avatarPublicId = avatarPublicId || '';
    await previousUser.save({ validateBeforeSave: false });
    return { user: sanitizeUser(previousUser), previousPublicId };
};

exports.updateUserRole = async ({ userId, role }) => {
    if (!['user', 'admin'].includes(role)) throw new AppError('Role must be user or admin', 400);
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    const previousRole = user.role;
    user.role = role;
    user.activeTokens = [];
    await user.save({ validateBeforeSave: false });
    return { user: sanitizeUser(user), previousRole };
};

exports.changePassword = async (userId, { currentPassword, newPassword }) => {
    if (!newPassword || String(newPassword).length < 8) throw new AppError('Please provide a new password of at least 8 characters', 400);
    const user = await User.findById(userId).select('+password');
    if (user.password && (!currentPassword || !await user.correctPassword(currentPassword, user.password))) throw new AppError('Current password is incorrect', 401);
    user.password = newPassword;
    user.hasLocalPassword = true;
    user.passwordChangedAt = new Date(Date.now() - 1000);
    user.activeTokens = [];
    await user.save();
};

exports.forgotPassword = async (email) => {
    const user = await User.findOne({ email: String(email || '').toLowerCase().trim() });
    // Always return successfully to prevent account enumeration.
    if (!user) return;
    const otp = createOTP();
    user.passwordResetOtpHash = hashToken(otp);
    user.passwordResetOtpExpires = new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);
    user.passwordResetOtpAttempts = 0;
    await user.save({ validateBeforeSave: false });
    try {
        await sendPasswordResetOTP({
            email: user.email,
            name: user.name,
            otp,
            expiresInMinutes: OTP_EXPIRES_IN_MINUTES,
        });
    } catch (error) {
        user.passwordResetOtpHash = undefined;
        user.passwordResetOtpExpires = undefined;
        user.passwordResetOtpAttempts = undefined;
        await user.save({ validateBeforeSave: false });
        throw new AppError('Could not send password reset OTP', 500);
    }
};

exports.resetPassword = async ({ email, otp, password }) => {
    if (!password || String(password).length < 8) throw new AppError('Password must be at least 8 characters', 400);
    if (!/^\d{6}$/.test(String(otp || ''))) throw new AppError('OTP must contain 6 digits', 400);
    const user = await User.findOne({ email: String(email || '').toLowerCase().trim() })
        .select('+passwordResetOtpHash +passwordResetOtpExpires +passwordResetOtpAttempts');
    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpires) throw new AppError('OTP is invalid or has expired', 400);
    if (user.passwordResetOtpExpires.getTime() <= Date.now()) {
        user.passwordResetOtpHash = undefined;
        user.passwordResetOtpExpires = undefined;
        user.passwordResetOtpAttempts = undefined;
        await user.save({ validateBeforeSave: false });
        throw new AppError('OTP is invalid or has expired', 400);
    }
    if (user.passwordResetOtpAttempts >= MAX_OTP_ATTEMPTS) throw new AppError('Too many invalid OTP attempts. Request a new code.', 429);
    if (hashToken(String(otp)) !== user.passwordResetOtpHash) {
        user.passwordResetOtpAttempts += 1;
        await user.save({ validateBeforeSave: false });
        throw new AppError('OTP is invalid or has expired', 400);
    }
    user.password = password;
    user.hasLocalPassword = true;
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpires = undefined;
    user.passwordResetOtpAttempts = undefined;
    user.passwordChangedAt = new Date(Date.now() - 1000);
    user.activeTokens = [];
    await user.save();
};
