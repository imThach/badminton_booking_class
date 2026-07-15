const coachService = require('../services/coachService');
const auditService = require('../services/auditService');
const cloudinaryAssetService = require('../services/cloudinaryAssetService');
const catchAsync = require('../utils/catchAsync');
const sendResponse = require('../utils/sendResponse');
const AppError = require('../utils/appError');

exports.uploadPhoto = catchAsync(async (req, res) => {
    if (!req.file?.buffer) throw new AppError('Please select a coach photo', 400);
    const uploaded = await cloudinaryAssetService.uploadCoachPhoto(req.file.buffer);
    sendResponse(res, 201, 'Coach photo uploaded successfully', { photo: uploaded.secure_url });
});

exports.list = catchAsync(async (req, res) => {
    const coaches = await coachService.list({ includeInactive: req.query.includeInactive === 'true' });
    sendResponse(res, 200, 'Coaches retrieved successfully', { coaches });
});

exports.create = catchAsync(async (req, res) => {
    const coach = await coachService.create(req.body, req.user.id);
    await auditService.writeAuditLog({
        req,
        action: 'COACH_CREATED',
        targetType: 'Coach',
        targetId: coach._id,
        changes: {
            photo: Boolean(coach.photo),
            bio: Boolean(coach.bio),
            isActive: coach.isActive,
        },
        metadata: { name: coach.name },
    });
    sendResponse(res, 201, 'Coach created successfully', { coach });
});

exports.update = catchAsync(async (req, res) => {
    const coach = await coachService.update(req.params.id, req.body);
    await auditService.writeAuditLog({ req, action: 'COACH_UPDATED', targetType: 'Coach', targetId: coach._id, changes: coach.$locals.auditChanges, metadata: { name: coach.name } });
    sendResponse(res, 200, 'Coach updated successfully', { coach });
});

exports.remove = catchAsync(async (req, res) => {
    const coach = await coachService.remove(req.params.id);
    await auditService.writeAuditLog({ req, action: 'COACH_DELETED', targetType: 'Coach', targetId: coach._id, changes: { wasActive: coach.isActive }, metadata: { name: coach.name } });
    res.status(204).end();
});
