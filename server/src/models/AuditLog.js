const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    actor: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true, index: true },
    targetId: { type: String, required: true, index: true },
    changes: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    expiresAt: { type: Date, index: { expires: 0 } },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('AuditLog', auditLogSchema);
