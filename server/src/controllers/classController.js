const classService = require('../services/classService');
const catchAsync = require('../utils/catchAsync');

exports.getAllClasses = catchAsync(async (req, res) => {
    const result = await classService.listClasses({
        level: req.query.level,
        limit: req.validatedQuery.limit,
        page: req.validatedQuery.page,
        searchTerm: req.query.name || req.query.title || req.query.search,
        upcoming: req.query.upcoming,
    });

    res.status(200).json({
        status: 'success',
        results: result.classes.length,
        pagination: result.pagination,
        data: {
            classes: result.classes,
        },
    });
});

exports.getClass = catchAsync(async (req, res) => {
    const classDetail = await classService.getClassById(req.params.id);

    res.status(200).json({
        status: 'success',
        data: {
            class: classDetail,
        },
    });
});

exports.createClass = catchAsync(async (req, res) => {
    const classDetail = await classService.createClass({
        payload: req.body,
        userId: req.user.id,
    });

    res.status(201).json({
        status: 'success',
        data: {
            class: classDetail,
        },
    });
});

exports.updateClass = catchAsync(async (req, res) => {
    const classDetail = await classService.updateClass({
        classId: req.params.id,
        payload: req.body,
    });

    res.status(200).json({
        status: 'success',
        data: {
            class: classDetail,
        },
    });
});

exports.deleteClass = catchAsync(async (req, res) => {
    await classService.deleteClass(req.params.id);

    res.status(204).end();
});

exports.getClassStudents = catchAsync(async (req, res) => {
    const result = await classService.getClassStudents(req.params.id);

    res.status(200).json({
        status: 'success',
        results: result.students.length,
        data: result,
    });
});

exports.kickStudentFromClass = catchAsync(async (req, res) => {
    const result = await classService.kickStudentFromClass({
        classId: req.params.id,
        userId: req.params.userId,
    });

    res.status(200).json({
        status: 'success',
        message: 'Student removed from class successfully',
        data: result,
    });
});
