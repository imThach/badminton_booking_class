const mongoose = require('mongoose');
const AppError = require('../utils/appError');

const validateObjectId = (value, label) => {
    if (!mongoose.isValidObjectId(value)) {
        throw new AppError(`Invalid ${label}`, 400);
    }
};

exports.validateObjectId = validateObjectId;

exports.validateClassIdParam = (req, res, next) => {
    validateObjectId(req.params.classId, 'class id');
    return next();
};

exports.validateEnrollmentIdParam = (req, res, next) => {
    validateObjectId(req.params.enrollmentId, 'enrollment id');
    return next();
};
