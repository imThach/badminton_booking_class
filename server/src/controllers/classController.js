const classService = require('../services/classService');
const catchAsync = require('../utils/catchAsync');
const sendResponse = require('../utils/sendResponse');

exports.getAllClasses = catchAsync(async (req, res) => {
    const result = await classService.listClasses({
        level: req.query.level,
        limit: req.validatedQuery.limit,
        page: req.validatedQuery.page,
        searchTerm: req.query.name || req.query.title || req.query.search,
        upcoming: req.query.upcoming,
    });

    sendResponse(res, 200, 'Classes retrieved successfully', {
        classes: result.classes,
        results: result.classes.length,
        pagination: result.pagination,
    });
});

exports.getClass = catchAsync(async (req, res) => {
    const classDetail = await classService.getClassById(req.params.id);

    sendResponse(res, 200, 'Class retrieved successfully', {
        class: classDetail,
    });
});

exports.createClass = catchAsync(async (req, res) => {
    const classDetail = await classService.createClass({
        payload: req.body,
        userId: req.user.id,
    });

    sendResponse(res, 201, 'Class created successfully', {
        class: classDetail,
    });
});

exports.updateClass = catchAsync(async (req, res) => {
    const classDetail = await classService.updateClass({
        classId: req.params.id,
        payload: req.body,
    });

    sendResponse(res, 200, 'Class updated successfully', {
        class: classDetail,
    });
});

exports.deleteClass = catchAsync(async (req, res) => {
    await classService.deleteClass(req.params.id);

    res.status(204).end();
});

exports.getClassStudents = catchAsync(async (req, res) => {
    const result = await classService.getClassStudents(req.params.id);

    sendResponse(res, 200, 'Class students retrieved successfully', {
        ...result,
        results: result.students.length,
    });
});

exports.kickStudentFromClass = catchAsync(async (req, res) => {
    const result = await classService.kickStudentFromClass({
        classId: req.params.id,
        userId: req.params.userId,
    });

    sendResponse(res, 200, 'Student removed from class successfully', result);
});
