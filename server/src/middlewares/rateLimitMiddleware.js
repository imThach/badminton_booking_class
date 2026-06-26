const AppError = require('../utils/appError');
const RateLimitCounter = require('../models/RateLimitCounter');

const createRateLimiter = ({
    name = 'default',
    windowMs = 15 * 60 * 1000,
    max = 10,
    keyGenerator = (req) => req.ip,
    message = 'Too many requests. Please try again later.',
} = {}) => {
    const prefix = `rate-limit:${name}`;

    const incrementCounter = async (key, resetAt, now) =>
        RateLimitCounter.findOneAndUpdate(
            {
                key,
                resetAt: { $gt: new Date(now) },
            },
            {
                $inc: { count: 1 },
                $setOnInsert: { key, resetAt },
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
            }
        );

    return async (req, res, next) => {
        const now = Date.now();
        const resetAt = new Date(now + windowMs);
        const key = `${prefix}:${keyGenerator(req)}`;

        try {
            let record;

            try {
                record = await incrementCounter(key, resetAt, now);
            } catch (error) {
                if (error.code !== 11000) {
                    throw error;
                }

                record = await incrementCounter(key, resetAt, now);
            }

            if (record.count > max) {
                const retryAfterSeconds = Math.max(Math.ceil((record.resetAt.getTime() - now) / 1000), 1);
                res.set('Retry-After', String(retryAfterSeconds));
                return next(new AppError(message, 429));
            }

            return next();
        } catch (error) {
            return next(error);
        }
    };
};

exports.loginRateLimiter = createRateLimiter({
    name: 'login',
    windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 10,
    keyGenerator: (req) => {
        const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : 'unknown';
        return `${req.ip}:${email}`;
    },
    message: 'Too many login attempts. Please try again later.',
});

exports.signupRateLimiter = createRateLimiter({
    name: 'signup',
    windowMs: Number(process.env.SIGNUP_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000,
    max: Number(process.env.SIGNUP_RATE_LIMIT_MAX) || 5,
    keyGenerator: (req) => {
        const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : 'unknown';
        return `${req.ip}:${email}`;
    },
    message: 'Too many signup attempts. Please try again later.',
});

exports.otpRateLimiter = createRateLimiter({
    name: 'otp',
    windowMs: Number(process.env.OTP_RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000,
    max: Number(process.env.OTP_RATE_LIMIT_MAX) || 5,
    keyGenerator: (req) => {
        const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : 'unknown';
        return `${req.ip}:${email}`;
    },
    message: 'Too many OTP attempts. Please try again later.',
});

exports.otpResendRateLimiter = createRateLimiter({
    name: 'otp-resend',
    windowMs: Number(process.env.OTP_RESEND_RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000,
    max: Number(process.env.OTP_RESEND_RATE_LIMIT_MAX) || 3,
    keyGenerator: (req) => {
        const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : 'unknown';
        return `${req.ip}:${email}`;
    },
    message: 'Too many OTP resend requests. Please try again later.',
});
