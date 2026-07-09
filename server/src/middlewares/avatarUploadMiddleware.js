const multer = require('multer');
const AppError = require('../utils/appError');

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 3 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, callback) => {
        if (!allowedTypes.has(file.mimetype)) {
            return callback(new AppError('Image must be a JPEG, PNG, or WebP file', 400));
        }
        callback(null, true);
    },
});

exports.uploadAvatar = upload.single('avatar');
exports.uploadCoachPhoto = upload.single('photo');
