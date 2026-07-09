const express = require('express');
const controller = require('../controllers/experienceController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const enrollmentValidator = require('../validators/enrollmentValidator');
const AppError = require('../utils/appError');

const router = express.Router();
router.get('/classes/:classId/reviews', enrollmentValidator.validateClassIdParam, controller.getReviews);
router.use(protect, restrictTo('user'));
router.get('/waitlist/me', controller.myWaitlist);
router.post('/classes/:classId/waitlist', controller.joinWaitlist);
router.delete('/classes/:classId/waitlist', controller.leaveWaitlist);
router.put('/classes/:classId/reviews', enrollmentValidator.validateClassIdParam, (req, res, next) => {
    if (Object.keys(req.body || {}).some((field) => !['rating', 'comment'].includes(field))) return next(new AppError('Review payload contains an invalid field', 400));
    if (!Number.isInteger(Number(req.body.rating)) || Number(req.body.rating) < 1 || Number(req.body.rating) > 5) return next(new AppError('rating must be an integer from 1 to 5', 400));
    if (req.body.comment !== undefined && String(req.body.comment).trim().length > 1000) return next(new AppError('comment cannot exceed 1000 characters', 400));
    return next();
}, controller.saveReview);
router.get('/bookmarks/me', controller.myBookmarks);
router.post('/classes/:classId/bookmark', controller.toggleBookmark);

module.exports = router;
