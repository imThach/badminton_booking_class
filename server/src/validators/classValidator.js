const mongoose = require('mongoose');
const AppError = require('../utils/appError');
const { parseSchedule } = require('../services/sessionGeneratorService');

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const CLASS_SORTS = ['date_asc', 'date_desc', 'price_asc', 'price_desc', 'popularity_desc', 'popularity_asc'];
const REQUIRED_CLASS_FIELDS = [
    'title',
    'description',
    'level',
    'startDate',
    'endDate',
    'schedule',
    'location',
    'maxStudents',
];
const ALLOWED_CLASS_FIELDS = new Set([...REQUIRED_CLASS_FIELDS, 'price', 'coachName']);
ALLOWED_CLASS_FIELDS.add('coach');
const ALLOWED_UPDATE_META_FIELDS = new Set(['_updatedAt']);

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';
const STRING_LIMITS = { title: 150, description: 3000, coachName: 100, schedule: 500, location: 200 };

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
        if (isBlank(payload.coach) && isBlank(payload.coachName)) {
            throw new AppError('coach is required', 400);
        }
    }

    fields.forEach((field) => {
        if (!ALLOWED_CLASS_FIELDS.has(field) && !(partial && ALLOWED_UPDATE_META_FIELDS.has(field))) {
            throw new AppError(`${field} is not allowed`, 400);
        }
    });

    Object.entries(STRING_LIMITS).forEach(([field, max]) => {
        if (payload[field] !== undefined) {
            const value = String(payload[field]).trim();
            if (!value) throw new AppError(`${field} cannot be empty`, 400);
            if (value.length > max) throw new AppError(`${field} cannot exceed ${max} characters`, 400);
        }
    });

    if (payload.level !== undefined && !LEVELS.includes(payload.level)) {
        throw new AppError('level must be beginner, intermediate, or advanced', 400);
    }

    if (payload.coach !== undefined && !mongoose.isValidObjectId(payload.coach)) {
        throw new AppError('coach must be a valid coach id', 400);
    }

    if (payload.maxStudents !== undefined && (!Number.isInteger(Number(payload.maxStudents)) || Number(payload.maxStudents) < 1)) {
        throw new AppError('maxStudents must be a positive integer', 400);
    }

    if (payload.price !== undefined && (!Number.isInteger(Number(payload.price)) || Number(payload.price) < 1000)) {
        throw new AppError('price must be an integer of at least 1000 VND', 400);
    }

    if (payload.startDate !== undefined && Number.isNaN(Date.parse(payload.startDate))) {
        throw new AppError('startDate must be a valid date', 400);
    }
    if (payload.startDate !== undefined && new Date(payload.startDate).getFullYear() > new Date().getFullYear() + 10) {
        throw new AppError('startDate is too far in the future', 400);
    }

    if (payload.endDate !== undefined && Number.isNaN(Date.parse(payload.endDate))) {
        throw new AppError('endDate must be a valid date', 400);
    }

    if (payload.startDate !== undefined && payload.endDate !== undefined
        && new Date(payload.endDate) <= new Date(payload.startDate)) {
        throw new AppError('endDate must be after startDate', 400);
    }

    if (!partial && !parseSchedule(payload.schedule, payload.startDate, payload.endDate)) {
        throw new AppError('schedule must contain valid weekdays; the class end time must be after its start time', 400);
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

    for (const field of ['minPrice', 'maxPrice']) {
        if (req.query[field] !== undefined && (!Number.isFinite(Number(req.query[field])) || Number(req.query[field]) < 0)) {
            return next(new AppError(`${field} must be a non-negative number`, 400));
        }
    }
    if (req.query.minPrice !== undefined && req.query.maxPrice !== undefined && Number(req.query.minPrice) > Number(req.query.maxPrice)) {
        return next(new AppError('minPrice cannot be greater than maxPrice', 400));
    }
    for (const field of ['name', 'title', 'search', 'coach', 'location']) {
        if (req.query[field] !== undefined && String(req.query[field]).length > 150) return next(new AppError(`${field} is too long`, 400));
    }
    for (const field of ['startDateFrom', 'startDateTo']) {
        if (req.query[field] && Number.isNaN(Date.parse(req.query[field]))) {
            return next(new AppError(`${field} must be a valid date`, 400));
        }
    }
    if (req.query.sort && !CLASS_SORTS.includes(req.query.sort)) {
        return next(new AppError(`sort must be one of: ${CLASS_SORTS.join(', ')}`, 400));
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
