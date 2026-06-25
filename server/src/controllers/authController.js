const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');
const sendResponse = require('../utils/sendResponse');

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

    sendResponse(res, statusCode, 'Login successful', {
        user: result.user,
    });
};

exports.signup = catchAsync(async (req, res) => {
    const result = await authService.signup(req.body);

    sendResponse(res, 202, 'OTP has been sent to your email. Verify OTP to create the account.', {
        email: result.email,
        otpExpiresInMinutes: result.otpExpiresInMinutes,
    });
});

exports.verifySignupOTP = catchAsync(async (req, res) => {
    const result = await authService.verifySignupOTP(req.body);
    sendResponse(res, 201, 'Account created successfully. Please log in.', {
        user: result.user,
    });
});

exports.resendSignupOTP = catchAsync(async (req, res) => {
    const result = await authService.resendSignupOTP(req.body);

    sendResponse(res, 200, 'A new OTP has been sent to your email.', {
        email: result.email,
        otpExpiresInMinutes: result.otpExpiresInMinutes,
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

    const logoutCookieOptions = { ...getCookieOptions(0), expires: new Date(1) };
    res.cookie('jwt', 'loggedout', logoutCookieOptions);
    sendResponse(res, 200, 'You have been logged out successfully.');
});

exports.getMe = (req, res) => {
    sendResponse(res, 200, 'Current user retrieved successfully', {
        user: req.user,
    });
};
