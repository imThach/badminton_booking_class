const express = require('express');
const classController = require('../controllers/classController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const classValidator = require('../validators/classValidator');

const router = express.Router();

router
    .route('/')
    .get(classValidator.validateClassListQuery, classController.getAllClasses)
    .post(protect, restrictTo('admin'), classValidator.validateCreateClass, classController.createClass);

router
    .route('/:id')
    .get(classValidator.validateClassIdParam, classController.getClass)
    .patch(protect, restrictTo('admin'), classValidator.validateClassIdParam, classValidator.validateUpdateClass, classController.updateClass)
    .delete(protect, restrictTo('admin'), classValidator.validateClassIdParam, classController.deleteClass);

router
    .route('/:id/students')
    .get(protect, restrictTo('admin'), classValidator.validateClassIdParam, classController.getClassStudents);

router
    .route('/:id/students/:userId')
    .delete(protect, restrictTo('admin'), classValidator.validateKickStudentParams, classController.kickStudentFromClass);

module.exports = router;
