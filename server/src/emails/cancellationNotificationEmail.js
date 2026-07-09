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

module.exports = ({ user, classDetail, cancelledAt, refundEligible, refundStatus }) => {
    const refundMessage = refundStatus === 'refund_pending'
        ? 'Your refund request has been submitted and is waiting for admin review.'
        : refundEligible
            ? 'Your refund eligibility is being reviewed.'
            : 'This enrollment is not eligible for a refund.';
    const classTime = formatDateTime(classDetail.startDate);
    const cancellationTime = formatDateTime(cancelledAt);
    const html = `<!doctype html>
<html lang="en">
<body style="margin:0;background:#f2f4f6;font-family:Arial,sans-serif;color:#17201d">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden">
<tr><td style="background:#006948;padding:28px 32px;color:#fff">
<div style="font-size:12px;letter-spacing:2px;opacity:.8">BADMINTON BOOKING</div>
<h1 style="margin:8px 0 0;font-size:25px">Class cancellation confirmed</h1>
</td></tr>
<tr><td style="padding:32px">
<p>Hello <strong>${escapeHtml(user.name || 'there')}</strong>,</p>
<p style="color:#4b5852;line-height:1.6">Your class cancellation request has been confirmed.</p>
<table width="100%" cellpadding="8" style="margin:24px 0;background:#f2f6f4;border-radius:10px">
<tr><td><strong>Class</strong></td><td>${escapeHtml(classDetail.title)}</td></tr>
<tr><td><strong>Start time</strong></td><td>${escapeHtml(classTime)}</td></tr>
<tr><td><strong>Cancelled at</strong></td><td>${escapeHtml(cancellationTime)}</td></tr>
<tr><td><strong>Refund</strong></td><td>${escapeHtml(refundMessage)}</td></tr>
</table>
<p style="font-size:13px;color:#718078">This is an automated email from Badminton Booking.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    return sendEmail({
        email: user.email,
        subject: `Class cancellation confirmed - ${classDetail.title}`,
        message: `Hello ${user.name || 'there'}, your cancellation for ${classDetail.title} was confirmed at ${cancellationTime}. ${refundMessage}`,
        html,
    });
};
