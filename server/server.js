require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/db');
const { startClassReminderJob } = require('./src/jobs/classReminderJob');

connectDB().then(() => startClassReminderJob());

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
