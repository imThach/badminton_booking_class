const express = require('express');
const classController = require('../controllers/classController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

router
    .route('/')
    .get(classController.getAllClasses)
    .post(protect, restrictTo('admin'), classController.createClass);

router
    .route('/:id')
    .get(classController.getClass)
    .patch(protect, restrictTo('admin'), classController.updateClass)
    .delete(protect, restrictTo('admin'), classController.deleteClass);

router
    .route('/:id/students')
    .get(protect, restrictTo('admin'), classController.getClassStudents);

router
    .route('/:id/students/:userId')
    .delete(protect, restrictTo('admin'), classController.kickStudentFromClass);

module.exports = router;
