const express = require('express');
const enrollmentController = require('../controllers/enrollmentController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const enrollmentValidator = require('../validators/enrollmentValidator');

const router = express.Router();

router.use(protect);

router.get('/me', enrollmentController.getMyEnrollments);
router.delete('/classes/:classId', restrictTo('user'), enrollmentValidator.validateClassIdParam, enrollmentController.cancelEnrollment);

module.exports = router;
