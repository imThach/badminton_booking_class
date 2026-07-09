const express = require('express');
const authController = require('../controllers/authController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const authValidator = require('../validators/authValidator');
const { uploadAvatar } = require('../middlewares/avatarUploadMiddleware');
const {
    loginRateLimiter,
    otpRateLimiter,
    otpResendRateLimiter,
    signupRateLimiter,
} = require('../middlewares/rateLimitMiddleware');

const router = express.Router();

router.post('/signup', signupRateLimiter, authValidator.validateSignup, authController.signup);
router.post('/verify-signup-otp', otpRateLimiter, authValidator.validateVerifySignupOTP, authController.verifySignupOTP);
router.post('/resend-signup-otp', otpResendRateLimiter, authValidator.validateResendSignupOTP, authController.resendSignupOTP);
router.post('/login', loginRateLimiter, authValidator.validateLogin, authController.login);
router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);
router.get('/google/pending', authController.getPendingGoogleSignup);
router.post('/google/confirm', authController.confirmGoogleSignup);
router.post('/google/cancel', authController.cancelGoogleSignup);
router.post('/forgot-password', loginRateLimiter, authValidator.validateForgotPassword, authController.forgotPassword);
router.patch('/reset-password', otpRateLimiter, authValidator.validateResetPassword, authController.resetPassword);
router.get('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.patch('/me', protect, authValidator.validateUpdateProfile, authController.updateMe);
router.patch('/me/avatar', protect, uploadAvatar, authController.uploadAvatar);
router.delete('/me/avatar', protect, authController.deleteAvatar);
router.patch('/admin/users/:userId/role', protect, restrictTo('admin'), authValidator.validateRoleUpdate, authController.updateUserRole);
router.patch('/change-password', protect, authValidator.validateChangePassword, authController.changePassword);

module.exports = router;
