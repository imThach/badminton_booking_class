const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please enter your full name'],
        },
        email: {
            type: String,
            required: [true, 'Please enter your email address'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Please enter a password'],
            select: false,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        passwordChangedAt: Date,
        isVerified: {
            type: Boolean,
            default: true,
        },
        // Lưu danh sách các token đang hoạt động trong DB
        activeTokens: [
            {
                tokenHash: {
                    type: String,
                    select: false,
                },
                createdAt: { type: Date, default: Date.now }
            }
        ],
    },
    { timestamps: true }
);

// Middleware: Mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    if (this.$locals.passwordAlreadyHashed) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Hàm hỗ trợ: So sánh mật khẩu khi đăng nhập
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Hàm hỗ trợ: Kiểm tra xem user có đổi mật khẩu sau khi token được tạo không
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTTimestamp < changedTimestamp;
    }

    return false;
};

module.exports = mongoose.model('User', userSchema);
