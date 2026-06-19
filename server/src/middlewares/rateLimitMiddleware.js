const AppError = require('../utils/appError');

const createRateLimiter = ({
    windowMs = 15 * 60 * 1000,
    max = 10,
    keyGenerator = (req) => req.ip,
    message = 'Too many requests. Please try again later.',
} = {}) => {
    const hits = new Map();

    return (req, res, next) => {
        const now = Date.now();
        const key = keyGenerator(req);
        const record = hits.get(key);

        if (!record || record.resetAt <= now) {
            hits.set(key, {
                count: 1,
                resetAt: now + windowMs,
            });
            return next();
        }

        record.count += 1;

        if (record.count > max) {
            const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
            res.set('Retry-After', String(retryAfterSeconds));
            return next(new AppError(message, 429));
        }

        return next();
    };
};

exports.loginRateLimiter = createRateLimiter({
    windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 10,
    keyGenerator: (req) => {
        const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : 'unknown';
        return `${req.ip}:${email}`;
    },
    message: 'Too many login attempts. Please try again later.',
});
