const classService = require('../services/classService');
const catchAsync = require('../utils/catchAsync');
const sendResponse = require('../utils/sendResponse');
const auditService = require('../services/auditService');
const sessionGenerator = require('../services/sessionGeneratorService');

exports.getAllClasses = catchAsync(async (req, res) => {
    const result = await classService.listClasses({
        level: req.query.level,
        limit: req.validatedQuery.limit,
        page: req.validatedQuery.page,
        searchTerm: req.query.name || req.query.title || req.query.search,
        upcoming: req.query.upcoming,
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice,
        startDateFrom: req.query.startDateFrom,
        startDateTo: req.query.startDateTo,
        coach: req.query.coach,
        location: req.query.location,
        sort: req.query.sort,
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
    await auditService.writeAuditLog({ req, action: 'CLASS_CREATED', targetType: 'Class', targetId: classDetail._id, metadata: { title: classDetail.title } });
    await sessionGenerator.generate(classDetail._id);

    sendResponse(res, 201, 'Class created successfully', {
        class: classDetail,
    });
});

exports.updateClass = catchAsync(async (req, res) => {
    const classDetail = await classService.updateClass({
        classId: req.params.id,
        payload: req.body,
    });
    await auditService.writeAuditLog({ req, action: 'CLASS_UPDATED', targetType: 'Class', targetId: classDetail._id, changes: { fields: Object.keys(req.body).filter(key => key !== '_updatedAt') }, metadata: { title: classDetail.title } });
    if (['startDate', 'endDate', 'schedule'].some((field) => req.body[field] !== undefined)) await sessionGenerator.generate(classDetail._id);

    sendResponse(res, 200, 'Class updated successfully', {
        class: classDetail,
    });
});

exports.deleteClass = catchAsync(async (req, res) => {
    const classDetail = await classService.deleteClass(req.params.id);
    await auditService.writeAuditLog({ req, action: 'CLASS_DELETED', targetType: 'Class', targetId: req.params.id, metadata: { title: classDetail.title } });

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
    await auditService.writeAuditLog({ req, action: 'STUDENT_REMOVED_FROM_CLASS', targetType: 'User', targetId: req.params.userId, metadata: { classId: req.params.id, studentName: result.removedStudent?.name, studentEmail: result.removedStudent?.email, alreadyRemoved: result.alreadyRemoved || false } });

    sendResponse(res, 200, 'Student removed from class successfully', result);
});
