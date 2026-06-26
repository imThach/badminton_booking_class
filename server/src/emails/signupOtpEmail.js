const sendEmail = require('../utils/email');

const createSignupOtpEmail = ({ name, otp, expiresInMinutes }) => {
    const safeName = name || 'there';

    const text = [
        `Hello ${safeName},`,
        '',
        `Your OTP for signing up is: ${otp}`,
        `This OTP will expire in ${expiresInMinutes} minutes.`,
        'If you did not request this OTP, please ignore this email.',
        'Thank you,',
    ].join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f2f4f6; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden; }
        .header { padding: 40px 30px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
        .header h1 { font-size: 28px; font-weight: 700; color: #111827; margin: 0; }
        .content { padding: 40px 30px; }
        .content p { font-size: 16px; color: #4b5563; line-height: 1.6; margin: 0 0 20px; }
        .otp-box { background-color: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
        .otp-code { font-size: 36px; font-weight: 700; color: #1e40af; letter-spacing: 8px; margin: 10px 0; }
        .footer { padding: 20px 30px; text-align: center; font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f2f4f6; padding: 20px 0;">
        <tr>
            <td align="center">
                <div class="container">
                    <div class="header">
                        <h1>Badminton Booking</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${safeName},</p>
                        <p>Thank you for signing up. Please use the following one-time password (OTP) to verify your account. This code is valid for ${expiresInMinutes} minutes.</p>
                        <div class="otp-box">
                            <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                            <p class="otp-code">${otp}</p>
                        </div>
                        <p>If you did not request this, you can safely ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Badminton Booking. All rights reserved.</p>
                    </div>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>`;

    return {
        subject: 'Badminton Booking - OTP verification',
        text,
        html,
    };
};

const sendSignupOTP = async ({ email, name, otp, expiresInMinutes }) => {
    const template = createSignupOtpEmail({ name, otp, expiresInMinutes });

    await sendEmail({
        email,
        subject: template.subject,
        message: template.text,
        html: template.html,
    });
};

module.exports = {
    createSignupOtpEmail,
    sendSignupOTP,
};
