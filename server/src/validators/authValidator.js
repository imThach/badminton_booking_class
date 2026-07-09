const AppError = require('../utils/appError');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_SIGNUP_FIELDS = new Set(['name', 'email', 'password', 'role', 'adminInviteCode']);
const ALLOWED_LOGIN_FIELDS = new Set(['email', 'password']);
const ALLOWED_OTP_FIELDS = new Set(['email', 'otp']);
const ALLOWED_RESEND_OTP_FIELDS = new Set(['email']);
const ROLES = ['user', 'admin'];
const SKILL_LEVELS = ['', 'beginner', 'intermediate', 'advanced'];
const PHONE_CHARACTERS_PATTERN = /^\+?[0-9 .()-]+$/;

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

    if (String(email).trim().length > 254 || !EMAIL_PATTERN.test(String(email).trim())) {
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
    if (String(password).length > 128) throw new AppError('password cannot exceed 128 characters', 400);
};

const validateName = (name) => {
    if (isBlank(name)) {
        throw new AppError('name is required', 400);
    }

    if (String(name).trim().length < 2) {
        throw new AppError('name must be at least 2 characters', 400);
    }
    if (String(name).trim().length > 100) throw new AppError('name cannot exceed 100 characters', 400);
};

const validateOTP = (otp) => {
    if (isBlank(otp)) {
        throw new AppError('otp is required', 400);
    }

    if (!/^\d{6}$/.test(String(otp).trim())) {
        throw new AppError('otp must be a 6-digit code', 400);
    }
};

const validatePhone = (phone) => {
    const value = String(phone || '').trim();
    if (!value) return;
    const digitCount = value.replace(/\D/g, '').length;
    const openParentheses = (value.match(/\(/g) || []).length;
    const closeParentheses = (value.match(/\)/g) || []).length;
    const parenthesesAreBalanced = openParentheses === closeParentheses
        && !value.includes(')(')
        && value.indexOf(')') >= value.indexOf('(');
    if (value.length > 30 || !PHONE_CHARACTERS_PATTERN.test(value) || digitCount < 8 || digitCount > 15 || !parenthesesAreBalanced) {
        throw new AppError('phone must contain 8 to 15 digits and use a valid phone number format', 400);
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
exports.validatePhone = validatePhone;
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

exports.validateForgotPassword = (req, res, next) => {
    rejectUnknownFields(req.body, new Set(['email']));
    validateEmail(req.body.email);
    return next();
};

exports.validateResetPassword = (req, res, next) => {
    rejectUnknownFields(req.body, new Set(['email', 'otp', 'password']));
    validateEmail(req.body.email);
    validateOTP(req.body.otp);
    validatePassword(req.body.password);
    return next();
};

exports.validateUpdateProfile = (req, res, next) => {
    const allowed = new Set(['name', 'phone', 'bio', 'skillLevel', 'preferredCourt']);
    rejectUnknownFields(req.body, allowed);
    if (!Object.keys(req.body || {}).length) throw new AppError('At least one profile field is required', 400);
    if (req.body.name !== undefined) validateName(req.body.name);
    if (req.body.phone !== undefined) validatePhone(req.body.phone);
    if (req.body.bio !== undefined && String(req.body.bio).trim().length > 500) throw new AppError('bio cannot exceed 500 characters', 400);
    if (req.body.skillLevel !== undefined && !SKILL_LEVELS.includes(String(req.body.skillLevel).trim().toLowerCase())) throw new AppError('skillLevel is invalid', 400);
    if (req.body.preferredCourt !== undefined && String(req.body.preferredCourt).trim().length > 150) throw new AppError('preferredCourt cannot exceed 150 characters', 400);
    return next();
};

exports.validateChangePassword = (req, res, next) => {
    rejectUnknownFields(req.body, new Set(['currentPassword', 'newPassword']));
    validatePassword(req.body.newPassword);
    if (req.body.currentPassword !== undefined && String(req.body.currentPassword).length > 128) throw new AppError('currentPassword cannot exceed 128 characters', 400);
    if (req.body.currentPassword && req.body.currentPassword === req.body.newPassword) throw new AppError('newPassword must be different from currentPassword', 400);
    return next();
};

exports.validateRoleUpdate = (req, res, next) => {
    rejectUnknownFields(req.body, new Set(['role']));
    if (!ROLES.includes(req.body.role)) throw new AppError('role must be user or admin', 400);
    return next();
};
