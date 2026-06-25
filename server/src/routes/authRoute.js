const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const authValidator = require('../validators/authValidator');
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
router.get('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;
