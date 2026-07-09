const cron = require('node-cron');
const notificationService = require('../services/notificationService');
const sessionGenerator = require('../services/sessionGeneratorService');

exports.startClassReminderJob = () => {
    const timezone = process.env.APP_TIMEZONE || 'Asia/Bangkok';
    const sessionTask = cron.schedule('5 0 * * *', () => sessionGenerator.generateDueSessions().catch((error) => console.error('Daily session generation failed:', error.message)), { timezone });
    sessionGenerator.generateDueSessions().catch((error) => console.error('Initial session generation failed:', error.message));
    if (String(process.env.ENABLE_EMAIL_REMINDERS || 'true') !== 'true') return sessionTask;
    const task = cron.schedule('*/5 * * * *', () => {
        notificationService.sendDueClassReminders().catch((error) => console.error('Class reminder job failed:', error.message));
    }, { timezone });
    notificationService.sendDueClassReminders().catch((error) => console.error('Initial class reminder check failed:', error.message));
    return { reminderTask: task, sessionTask };
};
