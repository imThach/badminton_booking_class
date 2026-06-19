const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
    class: {
        type: mongoose.Schema.ObjectId,
        ref: 'Class',
        required: [true, 'Đăng ký phải thuộc về một lớp học'],
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Đăng ký phải thuộc về một người dùng'],
    },
    enrolledAt: {
        type: Date,
        default: Date.now,
    },
});

// Ngăn chặn 1 user đăng ký 2 lần vào cùng 1 lớp ở cấp độ Database
enrollmentSchema.index({ class: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);