const nodemailer = require('nodemailer');

const sendEmail = async ({ email, subject, message, html }) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT || 587),
        secure: String(process.env.EMAIL_SECURE || 'false') === 'true',
        auth: {
            user: process.env.EMAIL_USERNAME || process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS,
        },
    });

    const sender = process.env.EMAIL_FROM || `Badminton Booking <${process.env.EMAIL_USERNAME || process.env.EMAIL_USER}>`;

    const info = await transporter.sendMail({
        from: sender,
        to: email,
        subject,
        text: message,
        html,
    });

    console.log('Email sent:', info.messageId);
    return info;
};

module.exports = sendEmail;
