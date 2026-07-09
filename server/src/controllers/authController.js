const authService = require('../services/authService');
const googleOAuthService = require('../services/googleOAuthService');
const cloudinaryAssetService = require('../services/cloudinaryAssetService');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const sendResponse = require('../utils/sendResponse');
const auditService = require('../services/auditService');

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

const GOOGLE_STATE_COOKIE = 'google_oauth_state';
const GOOGLE_SIGNUP_COOKIE = 'google_signup_pending';
const GOOGLE_COOKIE_PATH = '/api/v1/auth/google';

const getClientUrl = () =>
    String(process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:3000')
        .split(',')[0]
        .trim()
        .replace(/\/+$/, '');

exports.googleLogin = (req, res, next) => {
    try {
        const state = googleOAuthService.createState();
        res.cookie(GOOGLE_STATE_COOKIE, state, {
            ...getCookieOptions(10 * 60 * 1000),
            path: googleOAuthService.GOOGLE_CALLBACK_PATH,
        });
        res.redirect(googleOAuthService.getAuthUrl(state));
    } catch (error) {
        next(error);
    }
};

exports.googleCallback = catchAsync(async (req, res) => {
    const { code, state, error } = req.query;
    const expectedState = req.cookies?.[GOOGLE_STATE_COOKIE];
    res.clearCookie(GOOGLE_STATE_COOKIE, { path: googleOAuthService.GOOGLE_CALLBACK_PATH });

    if (error) throw new AppError(`Google login failed: ${error}`, 401);
    if (!code || !state || !expectedState || state !== expectedState) {
        throw new AppError('Invalid or expired Google OAuth state', 400);
    }

    const googleProfile = await googleOAuthService.getProfileFromCode(code);
    const result = await authService.loginWithGoogle(googleProfile);

    if (!result) {
        const pendingToken = googleOAuthService.signPendingSignup(googleProfile);
        res.cookie(GOOGLE_SIGNUP_COOKIE, pendingToken, {
            ...getCookieOptions(10 * 60 * 1000),
            path: GOOGLE_COOKIE_PATH,
        });
        return res.redirect(`${getClientUrl()}/google-signup`);
    }

    const cookieDays = Number(process.env.JWT_COOKIE_EXPIRES_IN) || 30;
    res.cookie('jwt', result.token, getCookieOptions(cookieDays * 24 * 60 * 60 * 1000));
    res.redirect(`${getClientUrl()}/?oauth=success`);
});

const getPendingGoogleProfile = (req) => {
    return googleOAuthService.verifyPendingSignup(req.cookies?.[GOOGLE_SIGNUP_COOKIE]);
};

exports.getPendingGoogleSignup = (req, res, next) => {
    try {
        const profile = getPendingGoogleProfile(req);
        sendResponse(res, 200, 'Google account is ready for signup', {
            profile: { name: profile.name, email: profile.email, avatar: profile.avatar },
        });
    } catch (error) {
        next(error);
    }
};

exports.confirmGoogleSignup = catchAsync(async (req, res) => {
    const profile = getPendingGoogleProfile(req);
    const result = await authService.loginWithGoogle(profile, { createIfMissing: true });
    res.clearCookie(GOOGLE_SIGNUP_COOKIE, { path: GOOGLE_COOKIE_PATH });
    sendTokenResponse(result, 201, res);
});

exports.cancelGoogleSignup = (req, res) => {
    res.clearCookie(GOOGLE_SIGNUP_COOKIE, { path: GOOGLE_COOKIE_PATH });
    sendResponse(res, 200, 'Google signup cancelled');
};

exports.updateMe = catchAsync(async (req, res) => {
    const user = await authService.updateProfile(req.user.id, req.body);
    sendResponse(res, 200, 'Profile updated', { user });
});

exports.uploadAvatar = catchAsync(async (req, res) => {
    if (!req.file?.buffer) throw new AppError('Please select an avatar image', 400);
    const uploaded = await cloudinaryAssetService.uploadAvatar(req.file.buffer);
    let updated;
    try {
        updated = await authService.updateAvatar(req.user.id, {
            avatar: uploaded.secure_url,
            avatarPublicId: uploaded.public_id,
        });
    } catch (error) {
        await cloudinaryAssetService.destroy(uploaded.public_id);
        throw error;
    }
    if (updated.previousPublicId) {
        await cloudinaryAssetService.destroy(updated.previousPublicId);
    }
    sendResponse(res, 200, 'Avatar updated', { user: updated.user });
});

exports.deleteAvatar = catchAsync(async (req, res) => {
    const updated = await authService.updateAvatar(req.user.id, { avatar: '', avatarPublicId: '' });
    if (updated.previousPublicId) {
        await cloudinaryAssetService.destroy(updated.previousPublicId);
    }
    sendResponse(res, 200, 'Avatar removed', { user: updated.user });
});

exports.updateUserRole = catchAsync(async (req, res) => {
    if (String(req.params.userId) === String(req.user.id)) throw new AppError('You cannot change your own role', 400);
    const result = await authService.updateUserRole({ userId: req.params.userId, role: req.body.role });
    await auditService.writeAuditLog({
        req,
        action: 'USER_ROLE_CHANGED',
        targetType: 'User',
        targetId: req.params.userId,
        changes: { role: { from: result.previousRole, to: result.user.role } },
        metadata: { email: result.user.email },
    });
    sendResponse(res, 200, 'User role updated', { user: result.user });
});

exports.changePassword = catchAsync(async (req, res) => {
    await authService.changePassword(req.user.id, req.body);
    res.clearCookie('jwt');
    sendResponse(res, 200, 'Password changed. Please log in again.');
});

exports.forgotPassword = catchAsync(async (req, res) => {
    await authService.forgotPassword(req.body.email);
    sendResponse(res, 200, 'If that email exists, a password reset OTP has been sent.');
});

exports.resetPassword = catchAsync(async (req, res) => {
    await authService.resetPassword(req.body);
    sendResponse(res, 200, 'Password reset successfully. Please log in.');
});
