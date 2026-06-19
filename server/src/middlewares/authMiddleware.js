const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { hashToken, sanitizeUser } = require('../services/authService');

exports.protect = catchAsync(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError('You are not logged in', 401));
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id).select('+activeTokens.tokenHash');

    if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exists', 401));
    }

    // Ngăn chặn token cũ nếu user đã đổi mật khẩu
    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('Mật khẩu gần đây đã được thay đổi! Vui lòng đăng nhập lại.', 401));
    }

    // Đảm bảo token vẫn còn tồn tại trong DB (nghĩa là user chưa bấm Đăng xuất)
    const tokenHash = hashToken(token);
    const isValidSession = currentUser.activeTokens.some(t => t.tokenHash === tokenHash);
    if (!isValidSession) {
        return next(new AppError('Phiên đăng nhập đã hết hạn hoặc đã bị đăng xuất.', 401));
    }

    req.token = token; // Lưu lại raw token để xử lý logout
    req.user = sanitizeUser(currentUser);
    next();
});

exports.restrictTo =
    (...roles) =>
        (req, res, next) => {
            if (!roles.includes(req.user.role)) {
                return next(new AppError('You do not have permission to perform this action', 403));
            }

            next();
        };
