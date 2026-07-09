const express = require('express');
const controller = require('../controllers/coachController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const AppError = require('../utils/appError');
const { uploadCoachPhoto } = require('../middlewares/avatarUploadMiddleware');

const router = express.Router();
const validate = (partial = false) => (req, res, next) => {
    const allowed = new Set(['name', 'photo', 'bio', 'isActive']);
    if (!partial && (!req.body.name || !String(req.body.name).trim())) return next(new AppError('name is required', 400));
    if (Object.keys(req.body || {}).some((key) => !allowed.has(key))) return next(new AppError('Coach payload contains an invalid field', 400));
    if (partial && !Object.keys(req.body || {}).length) return next(new AppError('At least one coach field is required', 400));
    if (req.body.name !== undefined && (String(req.body.name).trim().length < 2 || String(req.body.name).trim().length > 100)) return next(new AppError('name must contain 2 to 100 characters', 400));
    if (req.body.bio !== undefined && String(req.body.bio).trim().length > 2000) return next(new AppError('bio cannot exceed 2000 characters', 400));
    if (req.body.photo !== undefined && String(req.body.photo).length > 1000) return next(new AppError('photo URL is too long', 400));
    if (req.body.isActive !== undefined && typeof req.body.isActive !== 'boolean') return next(new AppError('isActive must be a boolean', 400));
    return next();
};

router.get('/', controller.list);
router.post('/photo', protect, restrictTo('admin'), uploadCoachPhoto, controller.uploadPhoto);
router.post('/', protect, restrictTo('admin'), validate(), controller.create);
router.patch('/:id', protect, restrictTo('admin'), validate(true), controller.update);
router.delete('/:id', protect, restrictTo('admin'), controller.remove);

module.exports = router;
