const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');

const getCookieOptions = (maxAgeMs) => ({
    expires: new Date(Date.now() + maxAgeMs),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
});

const sendTokenResponse = (result, statusCode, res) => {
    const cookieDays = Number(process.env.JWT_COOKIE_EXPIRES_IN) || 30;
    const cookieOptions = getCookieOptions(cookieDays * 24 * 60 * 60 * 1000);

    res.cookie('jwt', result.token, cookieOptions);

    res.status(statusCode).json({
        status: 'success',
        data: {
            user: result.user,
        },
    });
};

exports.signup = catchAsync(async (req, res) => {
    const result = await authService.signup(req.body);

    res.status(202).json({
        status: 'success',
        message: 'OTP has been sent to your email. Verify OTP to create the account.',
        data: {
            email: result.email,
            otpExpiresInMinutes: result.otpExpiresInMinutes,
        },
    });
});

exports.verifySignupOTP = catchAsync(async (req, res) => {
    const result = await authService.verifySignupOTP(req.body);
    res.status(201).json({
        status: 'success',
        message: 'Account created successfully. Please log in.',
        data: {
            user: result.user,
        },
    });
});

exports.resendSignupOTP = catchAsync(async (req, res) => {
    const result = await authService.resendSignupOTP(req.body);

    res.status(200).json({
        status: 'success',
        message: 'A new OTP has been sent to your email.',
        data: {
            email: result.email,
            otpExpiresInMinutes: result.otpExpiresInMinutes,
        },
    });
});

exports.login = catchAsync(async (req, res) => {
    const result = await authService.login(req.body);
    sendTokenResponse(result, 200, res);
});

exports.logout = catchAsync(async (req, res) => {
    if (req.user && req.token) {
        await authService.logout(req.user.id, req.token);
    }

    res.cookie('jwt', 'loggedout', getCookieOptions(10 * 1000));
    res.status(200).json({ status: 'success' });
});

exports.getMe = (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user,
        },
    });
};
