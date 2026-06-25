const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

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
});

exports.sanitizeUser = sanitizeUser;

const createOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendSignupOTP = async ({ email, name, otp }) => {
    await sendEmail({
        email,
        subject: 'Badminton Booking - OTP verification',
        message: [
            `Hello ${name},`,
            '',
            `your OTP for signing up is: ${otp}`,
            `This OTP will expire in ${OTP_EXPIRES_IN_MINUTES} minutes.`,
            'If you did not request this OTP, please ignore this email.',
            'Thank you,',
        ].join('\n'),
    });
};

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
        await sendSignupOTP({ email: normalizedEmail, name, otp });
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

    const otp = createOTP();
    pending.otpHash = PendingRegistration.hashOTP(otp);
    pending.otpExpires = new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);
    pending.attempts = 0;
    await pending.save();

    await sendSignupOTP({ email: pending.email, name: pending.name, otp });

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
    if (!user || !(await user.correctPassword(password, user.password))) {
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
