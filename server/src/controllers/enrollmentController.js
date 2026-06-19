const enrollmentService = require('../services/enrollmentService');
const catchAsync = require('../utils/catchAsync');

exports.enrollClass = catchAsync(async (req, res) => {
    const enrollment = await enrollmentService.enrollClass({
        classId: req.params.classId,
        userId: req.user.id,
    });

    res.status(201).json({
        status: 'success',
        data: {
            enrollment,
        },
    });
});

exports.cancelEnrollment = catchAsync(async (req, res) => {
    const enrollment = await enrollmentService.cancelEnrollment({
        classId: req.params.classId,
        userId: req.user.id,
    });

    res.status(200).json({
        status: 'success',
        message: 'Enrollment cancelled successfully',
        data: {
            enrollment,
        },
    });
});

exports.getMyEnrollments = catchAsync(async (req, res) => {
    const enrollments = await enrollmentService.getMyEnrollments(req.user.id);

    res.status(200).json({
        status: 'success',
        results: enrollments.length,
        data: {
            enrollments,
        },
    });
});
