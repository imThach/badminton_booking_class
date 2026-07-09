const configureCloudinary = require('../config/cloudinary');

const uploadBuffer = (buffer, options) => new Promise((resolve, reject) => {
    const stream = configureCloudinary().uploader.upload_stream(
        {
            resource_type: 'image',
            ...options,
        },
        (error, result) => error ? reject(error) : resolve(result)
    );
    stream.end(buffer);
});

exports.uploadAvatar = (buffer) => uploadBuffer(buffer, {
    folder: 'badminton-booking/avatars',
    transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' }],
});

exports.uploadCoachPhoto = (buffer) => uploadBuffer(buffer, {
    folder: 'badminton-booking/coaches',
    transformation: [{ width: 800, height: 800, crop: 'limit' }, { quality: 'auto', fetch_format: 'auto' }],
});

exports.destroy = (publicId) => {
    if (!publicId) return Promise.resolve();
    return configureCloudinary().uploader.destroy(publicId).catch(() => undefined);
};
