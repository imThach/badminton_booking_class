const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { loginRateLimiter } = require('../middlewares/rateLimitMiddleware');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/verify-signup-otp', authController.verifySignupOTP);
router.post('/resend-signup-otp', authController.resendSignupOTP);
router.post('/login', loginRateLimiter, authController.login);
router.get('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;
