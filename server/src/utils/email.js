const nodemailer = require('nodemailer');

const sendEmail = async ({ email, subject, message, html }) => {
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = Number(process.env.EMAIL_PORT || 465);
    const secure = process.env.EMAIL_SECURE
        ? String(process.env.EMAIL_SECURE) === 'true'
        : port === 465;
    const user = process.env.EMAIL_USERNAME || process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user,
            pass,
        },
        connectionTimeout: Number(process.env.EMAIL_CONNECTION_TIMEOUT_MS || 10000),
        greetingTimeout: Number(process.env.EMAIL_GREETING_TIMEOUT_MS || 10000),
        socketTimeout: Number(process.env.EMAIL_SOCKET_TIMEOUT_MS || 20000),
        tls: {
            servername: host,
        },
    });

    const sender = process.env.EMAIL_FROM || `Badminton Booking <${user}>`;

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
