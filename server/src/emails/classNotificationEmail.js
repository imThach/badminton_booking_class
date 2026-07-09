const sendEmail = require('../utils/email');

const escapeHtml = (value) => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const formatDateTime = (date) => new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: process.env.APP_TIMEZONE || 'Asia/Bangkok',
}).format(new Date(date));

const formatMoney = (amount) => `${Number(amount || 0).toLocaleString('en-US')} VND`;

const layout = ({ title, intro, name, classDetail, extra = '' }) => `<!doctype html>
<html lang="en">
<body style="margin:0;background:#f2f4f6;font-family:Arial,sans-serif;color:#17201d">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden">
<tr><td style="background:#006948;padding:28px 32px;color:#fff">
<div style="font-size:12px;letter-spacing:2px;opacity:.8">BADMINTON BOOKING</div>
<h1 style="margin:8px 0 0;font-size:25px">${escapeHtml(title)}</h1>
</td></tr>
<tr><td style="padding:32px">
<p>Hello <strong>${escapeHtml(name || 'there')}</strong>,</p>
<p style="color:#4b5852;line-height:1.6">${escapeHtml(intro)}</p>
<table width="100%" cellpadding="8" style="margin:24px 0;background:#f2f6f4;border-radius:10px">
<tr><td><strong>Class</strong></td><td>${escapeHtml(classDetail.title)}</td></tr>
<tr><td><strong>Start time</strong></td><td>${escapeHtml(formatDateTime(classDetail.startDate))}</td></tr>
<tr><td><strong>Schedule</strong></td><td>${escapeHtml(classDetail.schedule)}</td></tr>
<tr><td><strong>Location</strong></td><td>${escapeHtml(classDetail.location)}</td></tr>
<tr><td><strong>Coach</strong></td><td>${escapeHtml(classDetail.coachName)}</td></tr>
${extra}
</table>
<p style="font-size:13px;color:#718078">This is an automated email from Badminton Booking.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

exports.sendEnrollmentConfirmation = ({ user, classDetail }) => sendEmail({
    email: user.email,
    subject: `Class enrollment confirmed - ${classDetail.title}`,
    message: `Hello ${user.name || 'there'}, your enrollment for ${classDetail.title} has been confirmed. The class starts at ${formatDateTime(classDetail.startDate)} at ${classDetail.location}.`,
    html: layout({
        title: 'Class enrollment confirmed',
        intro: 'Your spot has been confirmed. Here are the class details.',
        name: user.name,
        classDetail,
    }),
});

exports.sendPaymentConfirmation = ({ user, classDetail, payment }) => sendEmail({
    email: user.email,
    subject: `Payment confirmed - ${payment.invoiceNumber}`,
    message: `Your payment of ${formatMoney(payment.amount)} for ${classDetail.title} was successful. Transaction reference: ${payment.txnRef}.`,
    html: layout({
        title: 'Payment confirmed',
        intro: 'VNPAY has confirmed your transaction.',
        name: user.name,
        classDetail,
        extra: `<tr><td><strong>Amount</strong></td><td>${formatMoney(payment.amount)}</td></tr><tr><td><strong>Transaction reference</strong></td><td>${escapeHtml(payment.txnRef)}</td></tr>`,
    }),
});

exports.sendClassReminder = ({ user, classDetail, hours }) => {
    const reminderWindow = hours === 24 ? '1 day' : '1 hour';

    return sendEmail({
        email: user.email,
        subject: `Reminder: ${classDetail.title} starts in ${reminderWindow}`,
        message: `${classDetail.title} starts in ${reminderWindow}, at ${formatDateTime(classDetail.startDate)} at ${classDetail.location}.`,
        html: layout({
            title: `Your class starts in ${reminderWindow}`,
            intro: 'Please remember to bring your sportswear and racket, and arrive on time.',
            name: user.name,
            classDetail,
        }),
    });
};
