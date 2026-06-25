const enrollmentService = require('../services/enrollmentService');
const catchAsync = require('../utils/catchAsync');
const sendResponse = require('../utils/sendResponse');

exports.enrollClass = catchAsync(async (req, res) => {
    const enrollment = await enrollmentService.enrollClass({
        classId: req.params.classId,
        userId: req.user.id,
    });

    sendResponse(res, 201, 'Enrollment created successfully', {
        enrollment,
    });
});

exports.cancelEnrollment = catchAsync(async (req, res) => {
    const enrollment = await enrollmentService.cancelEnrollment({
        classId: req.params.classId,
        userId: req.user.id,
    });

    sendResponse(res, 200, 'Enrollment cancelled successfully', {
        enrollment,
    });
});

exports.getMyEnrollments = catchAsync(async (req, res) => {
    const enrollments = await enrollmentService.getMyEnrollments(req.user.id);

    sendResponse(res, 200, 'Enrollments retrieved successfully', {
        enrollments,
        results: enrollments.length,
    });
});
