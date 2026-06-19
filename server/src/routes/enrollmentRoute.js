const express = require('express');
const enrollmentController = require('../controllers/enrollmentController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/me', enrollmentController.getMyEnrollments);
router.post('/classes/:classId', enrollmentController.enrollClass);
router.delete('/classes/:classId', enrollmentController.cancelEnrollment);

module.exports = router;
