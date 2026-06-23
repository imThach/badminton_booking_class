const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');

const sendTokenResponse = (result, statusCode, res) => {
    const cookieOptions = {
        expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 30) * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    };

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

    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
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
