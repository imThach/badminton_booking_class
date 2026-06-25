const AppError = require('../utils/appError');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_SIGNUP_FIELDS = new Set(['name', 'email', 'password', 'role', 'adminInviteCode']);
const ALLOWED_LOGIN_FIELDS = new Set(['email', 'password']);
const ALLOWED_OTP_FIELDS = new Set(['email', 'otp']);
const ALLOWED_RESEND_OTP_FIELDS = new Set(['email']);
const ROLES = ['user', 'admin'];

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

const rejectUnknownFields = (payload = {}, allowedFields) => {
    Object.keys(payload).forEach((field) => {
        if (!allowedFields.has(field)) {
            throw new AppError(`${field} is not allowed`, 400);
        }
    });
};

const validateEmail = (email) => {
    if (isBlank(email)) {
        throw new AppError('email is required', 400);
    }

    if (!EMAIL_PATTERN.test(String(email).trim())) {
        throw new AppError('email must be a valid email address', 400);
    }
};

const validatePassword = (password) => {
    if (isBlank(password)) {
        throw new AppError('password is required', 400);
    }

    if (String(password).length < 8) {
        throw new AppError('password must be at least 8 characters', 400);
    }
};

const validateName = (name) => {
    if (isBlank(name)) {
        throw new AppError('name is required', 400);
    }

    if (String(name).trim().length < 2) {
        throw new AppError('name must be at least 2 characters', 400);
    }
};

const validateOTP = (otp) => {
    if (isBlank(otp)) {
        throw new AppError('otp is required', 400);
    }

    if (!/^\d{6}$/.test(String(otp).trim())) {
        throw new AppError('otp must be a 6-digit code', 400);
    }
};

const validateSignupPayload = (payload = {}) => {
    rejectUnknownFields(payload, ALLOWED_SIGNUP_FIELDS);
    validateName(payload.name);
    validateEmail(payload.email);
    validatePassword(payload.password);

    if (payload.role !== undefined && !ROLES.includes(payload.role)) {
        throw new AppError('role must be user or admin', 400);
    }

    if (payload.role === 'admin' && isBlank(payload.adminInviteCode)) {
        throw new AppError('adminInviteCode is required for admin signup', 400);
    }
};

const validateLoginPayload = (payload = {}) => {
    rejectUnknownFields(payload, ALLOWED_LOGIN_FIELDS);
    validateEmail(payload.email);
    validatePassword(payload.password);
};

const validateVerifyOTPPayload = (payload = {}) => {
    rejectUnknownFields(payload, ALLOWED_OTP_FIELDS);
    validateEmail(payload.email);
    validateOTP(payload.otp);
};

const validateResendOTPPayload = (payload = {}) => {
    rejectUnknownFields(payload, ALLOWED_RESEND_OTP_FIELDS);
    validateEmail(payload.email);
};

exports.validateEmail = validateEmail;
exports.validatePassword = validatePassword;
exports.validateName = validateName;
exports.validateOTP = validateOTP;
exports.validateSignupPayload = validateSignupPayload;
exports.validateLoginPayload = validateLoginPayload;
exports.validateVerifyOTPPayload = validateVerifyOTPPayload;
exports.validateResendOTPPayload = validateResendOTPPayload;

exports.validateSignup = (req, res, next) => {
    validateSignupPayload(req.body);
    return next();
};

exports.validateLogin = (req, res, next) => {
    validateLoginPayload(req.body);
    return next();
};

exports.validateVerifySignupOTP = (req, res, next) => {
    validateVerifyOTPPayload(req.body);
    return next();
};

exports.validateResendSignupOTP = (req, res, next) => {
    validateResendOTPPayload(req.body);
    return next();
};
