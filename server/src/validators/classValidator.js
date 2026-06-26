const mongoose = require('mongoose');
const AppError = require('../utils/appError');

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const REQUIRED_CLASS_FIELDS = [
    'title',
    'description',
    'coachName',
    'level',
    'startDate',
    'schedule',
    'location',
    'maxStudents',
];
const ALLOWED_CLASS_FIELDS = new Set(REQUIRED_CLASS_FIELDS);
const ALLOWED_UPDATE_META_FIELDS = new Set(['_updatedAt']);

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

const validateObjectId = (value, label) => {
    if (!mongoose.isValidObjectId(value)) {
        throw new AppError(`Invalid ${label}`, 400);
    }
};

const parsePagination = ({ limit, page }) => ({
    limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
    page: Math.max(Number(page) || 1, 1),
});

const validateClassPayload = (payload, { partial = false } = {}) => {
    const fields = Object.keys(payload || {});

    if (!partial) {
        REQUIRED_CLASS_FIELDS.forEach((field) => {
            if (isBlank(payload[field])) {
                throw new AppError(`${field} is required`, 400);
            }
        });
    }

    fields.forEach((field) => {
        if (!ALLOWED_CLASS_FIELDS.has(field) && !(partial && ALLOWED_UPDATE_META_FIELDS.has(field))) {
            throw new AppError(`${field} is not allowed`, 400);
        }
    });

    if (payload.level !== undefined && !LEVELS.includes(payload.level)) {
        throw new AppError('level must be beginner, intermediate, or advanced', 400);
    }

    if (payload.maxStudents !== undefined && (!Number.isInteger(Number(payload.maxStudents)) || Number(payload.maxStudents) < 1)) {
        throw new AppError('maxStudents must be a positive integer', 400);
    }

    if (payload.startDate !== undefined && Number.isNaN(Date.parse(payload.startDate))) {
        throw new AppError('startDate must be a valid date', 400);
    }
};

exports.validateObjectId = validateObjectId;
exports.parsePagination = parsePagination;
exports.validateClassPayload = validateClassPayload;

exports.validateClassListQuery = (req, res, next) => {
    req.validatedQuery = parsePagination(req.query);

    if (req.query.level && !LEVELS.includes(req.query.level)) {
        return next(new AppError('level must be beginner, intermediate, or advanced', 400));
    }

    if (req.query.upcoming && !['true', 'false'].includes(req.query.upcoming)) {
        return next(new AppError('upcoming must be true or false', 400));
    }

    return next();
};

exports.validateClassIdParam = (req, res, next) => {
    validateObjectId(req.params.id, 'class id');
    return next();
};

exports.validateKickStudentParams = (req, res, next) => {
    validateObjectId(req.params.id, 'class id');
    validateObjectId(req.params.userId, 'user id');
    return next();
};

exports.validateCreateClass = (req, res, next) => {
    validateClassPayload(req.body);
    return next();
};

exports.validateUpdateClass = (req, res, next) => {
    validateClassPayload(req.body, { partial: true });
    return next();
};
