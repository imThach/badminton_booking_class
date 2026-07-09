const crypto = require('crypto');
const notificationService = require('../services/notificationService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendResponse = require('../utils/sendResponse');

const secretsMatch = (provided, expected) => {
    const a = Buffer.from(String(provided || ''));
    const b = Buffer.from(String(expected || ''));
    return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
};

exports.runReminders = catchAsync(async (req, res) => {
    if (!process.env.CRON_SECRET || !secretsMatch(req.headers['x-cron-secret'], process.env.CRON_SECRET)) {
        throw new AppError('Invalid cron secret', 401);
    }
    await notificationService.sendDueClassReminders();
    sendResponse(res, 200, 'Reminder check completed');
});
