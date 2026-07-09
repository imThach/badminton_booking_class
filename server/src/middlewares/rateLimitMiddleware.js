const AppError = require('../utils/appError');
const RateLimitCounter = require('../models/RateLimitCounter');
const { getRedisClient } = require('../config/redis');

const incrementRedisCounter = async (key, windowMs) => {
    const redis = await getRedisClient();
    if (!redis) return null;
    const result = await redis.eval(
        "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]); end; local ttl = redis.call('PTTL', KEYS[1]); return {count, ttl}",
        1,
        key,
        windowMs
    );
    return { count: Number(result[0]), ttlMs: Number(result[1]) };
};

const createRateLimiter = ({
    name = 'default',
    windowMs = 15 * 60 * 1000,
    max = 10,
    keyGenerator = (req) => req.ip,
    message = 'Too many requests. Please try again later.',
} = {}) => {
    const prefix = `rate-limit:${name}`;

    const incrementCounter = async (key, resetAt, now) => {
        let record = await RateLimitCounter.findOneAndUpdate(
            { key, resetAt: { $gt: new Date(now) } },
            { $inc: { count: 1 } },
            { new: true }
        );
        if (record) return record;
        try {
            return await RateLimitCounter.create({ key, count: 1, resetAt });
        } catch (error) {
            if (error.code !== 11000) throw error;
        }
        record = await RateLimitCounter.findOneAndUpdate(
            { key, resetAt: { $lte: new Date(now) } },
            { $set: { count: 1, resetAt } },
            { new: true }
        );
        if (record) return record;
        return RateLimitCounter.findOneAndUpdate(
            { key, resetAt: { $gt: new Date(now) } },
            { $inc: { count: 1 } },
            { new: true }
        );
    };

    return async (req, res, next) => {
        const now = Date.now();
        const resetAt = new Date(now + windowMs);
        const key = `${prefix}:${keyGenerator(req)}`;

        try {
            let record;

            try {
                const redisRecord = await incrementRedisCounter(key, windowMs);
                if (redisRecord) {
                    const retryAfterSeconds = Math.max(Math.ceil(redisRecord.ttlMs / 1000), 1);
                    res.set('RateLimit-Limit', String(max));
                    res.set('RateLimit-Remaining', String(Math.max(max - redisRecord.count, 0)));
                    res.set('RateLimit-Reset', String(retryAfterSeconds));
                    if (redisRecord.count > max) {
                        res.set('Retry-After', String(retryAfterSeconds));
                        return next(new AppError(message, 429));
                    }
                    return next();
                }
            } catch (redisError) {
                if (String(process.env.RATE_LIMIT_FALLBACK || 'mongodb') !== 'mongodb') throw redisError;
                console.error('Redis rate limiter fallback:', redisError.message);
            }

            record = await incrementCounter(key, resetAt, now);

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
