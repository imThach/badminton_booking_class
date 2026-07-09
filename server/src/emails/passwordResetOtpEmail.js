const sendEmail = require('../utils/email');

exports.sendPasswordResetOTP = async ({ email, name, otp, expiresInMinutes }) => {
    const safeName = name || 'there';
    await sendEmail({
        email,
        subject: 'Badminton Booking - Password reset OTP',
        message: `Hello ${safeName},\n\nYour password reset OTP is: ${otp}\nThis code expires in ${expiresInMinutes} minutes.\n\nIf you did not request this, please ignore this email.`,
        html: `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f2f4f6;padding:24px"><div style="max-width:560px;margin:auto;background:white;border-radius:12px;padding:32px"><h1 style="margin-top:0">Badminton Booking</h1><p>Hello ${safeName},</p><p>Use this one-time code to confirm your password reset:</p><div style="margin:28px 0;padding:20px;text-align:center;background:#f3f4f6;border-radius:8px;font-size:36px;font-weight:700;letter-spacing:8px;color:#1e40af">${otp}</div><p>This code expires in ${expiresInMinutes} minutes. Never share it with anyone.</p><p>If you did not request a password reset, you can safely ignore this email.</p></div></body></html>`,
    });
};
