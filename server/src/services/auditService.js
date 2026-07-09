const AuditLog = require('../models/AuditLog');
const Class = require('../models/Class');
const User = require('../models/User');
const Coach = require('../models/Coach');
const Payment = require('../models/Payment');

exports.writeAuditLog = async ({ req, action, targetType, targetId, changes, metadata }) => {
    const retentionDays = Number(process.env.AUDIT_LOG_RETENTION_DAYS || 365);
    return AuditLog.create({
        actor: req.user.id,
        action,
        targetType,
        targetId: String(targetId),
        changes,
        metadata,
        ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
        userAgent: String(req.get('user-agent') || '').slice(0, 500),
        expiresAt: retentionDays > 0 ? new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000) : undefined,
    });
};

exports.listAuditLogs = async ({ page = 1, limit = 20, action, targetType }) => {
    const filter = {};
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;
    const [logs, total] = await Promise.all([
        AuditLog.find(filter)
            .select('-ipAddress -userAgent')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('actor', 'name email role')
            .lean(),
        AuditLog.countDocuments(filter),
    ]);

    const idsByType = logs.reduce((grouped, log) => {
        if (!grouped[log.targetType]) grouped[log.targetType] = [];
        grouped[log.targetType].push(log.targetId);
        return grouped;
    }, {});
    const [classes, users, coaches, payments] = await Promise.all([
        Class.find({ _id: { $in: idsByType.Class || [] } }).select('title').lean(),
        User.find({ _id: { $in: idsByType.User || [] } }).select('name email').lean(),
        Coach.find({ _id: { $in: idsByType.Coach || [] } }).select('name').lean(),
        Payment.find({ _id: { $in: idsByType.Payment || [] } }).select('txnRef').lean(),
    ]);
    const names = new Map([
        ...classes.map((item) => [`Class:${item._id}`, item.title]),
        ...users.map((item) => [`User:${item._id}`, item.name || item.email]),
        ...coaches.map((item) => [`Coach:${item._id}`, item.name]),
        ...payments.map((item) => [`Payment:${item._id}`, item.txnRef]),
    ]);
    const fallbackName = (log) => log.metadata?.title
        || log.metadata?.name
        || log.metadata?.studentName
        || log.metadata?.studentEmail
        || log.metadata?.email
        || log.metadata?.txnRef
        || 'Đối tượng đã bị xóa';

    return {
        logs: logs.map((log) => ({
            ...log,
            targetName: names.get(`${log.targetType}:${log.targetId}`) || fallbackName(log),
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
};
