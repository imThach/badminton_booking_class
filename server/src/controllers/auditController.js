const auditService = require('../services/auditService');
const catchAsync = require('../utils/catchAsync');
const sendResponse = require('../utils/sendResponse');

exports.getAuditLogs = catchAsync(async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const result = await auditService.listAuditLogs({ page, limit, action: req.query.action, targetType: req.query.targetType });
    sendResponse(res, 200, 'Audit logs retrieved', { logs: result.logs, pagination: result.pagination });
});
