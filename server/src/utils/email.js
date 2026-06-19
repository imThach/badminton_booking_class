const nodemailer = require('nodemailer');
const dns = require('dns').promises;

const getSender = () =>
    process.env.EMAIL_FROM ||
    `Badminton Booking <${process.env.EMAIL_USERNAME || process.env.EMAIL_USER}>`;

const sendEmail = async ({ email, subject, message, html }) => {
    const host = process.env.EMAIL_HOST || 'smtp-relay.brevo.com'; 
    const addressFamily = Number(process.env.EMAIL_ADDRESS_FAMILY || 4);

    const resolvedHost =
        addressFamily === 4 && process.env.EMAIL_RESOLVE_IPV4 === 'true'
            ? (await dns.resolve4(host))[0]
            : host;

    const port = Number(process.env.EMAIL_PORT || 2525);

    const secure = process.env.EMAIL_SECURE !== undefined
        ? String(process.env.EMAIL_SECURE) === 'true'
        : port === 465;

    const user = process.env.EMAIL_USERNAME || process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;

    const transporter = nodemailer.createTransport({
        host: resolvedHost,
        port,
        secure,
        auth: {
            user,
            pass,
        },
        connectionTimeout: Number(process.env.EMAIL_CONNECTION_TIMEOUT_MS || 10000),
        greetingTimeout: Number(process.env.EMAIL_GREETING_TIMEOUT_MS || 10000),
        socketTimeout: Number(process.env.EMAIL_SOCKET_TIMEOUT_MS || 20000),
        requireTLS: String(process.env.EMAIL_REQUIRE_TLS || 'false') === 'true',
        family: addressFamily,
        logger: String(process.env.EMAIL_DEBUG || 'false') === 'true',
        debug: String(process.env.EMAIL_DEBUG || 'false') === 'true',
        tls: {
            servername: host,
        },
    });

    const info = await transporter.sendMail({
        from: getSender(),
        to: email,
        subject,
        text: message,
        html,
    });

    console.log('Email sent:', info.messageId);
    return info;
};

module.exports = sendEmail;