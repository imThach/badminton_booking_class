const sessionService = require('../services/sessionService');
const catchAsync = require('../utils/catchAsync');
const send = require('../utils/sendResponse');
const auditService = require('../services/auditService');

const sessionTitle = (session) => `${new Date(session.startDate).toISOString()} - ${new Date(session.endDate).toISOString()}`;
const parsePagination = (query = {}, defaultLimit = 20, maxLimit = 100) => ({
    page: Math.max(Math.floor(Number(query.page) || 1), 1),
    limit: Math.min(Math.max(Math.floor(Number(query.limit) || defaultLimit), 1), maxLimit),
});

exports.list = catchAsync(async (req, res) => {
    const result = await sessionService.listSessions({
        classId: req.params.classId,
        ...parsePagination(req.query),
    });
    send(res, 200, 'Sessions retrieved', result);
});

exports.generate = catchAsync(async (req, res) => {
    const sessions = await sessionService.generateSessions(req.params.classId);
    await auditService.writeAuditLog({
        req,
        action: 'SESSIONS_GENERATED',
        targetType: 'Class',
        targetId: req.params.classId,
        changes: { generatedCount: sessions.length },
        metadata: { classId: req.params.classId },
    });
    send(res, 200, 'Sessions generated', { sessions });
});

exports.create = catchAsync(async (req, res) => {
    const session = await sessionService.createSession({
        classId: req.params.classId,
        payload: req.body,
    });
    await auditService.writeAuditLog({
        req,
        action: 'SESSION_CREATED',
        targetType: 'ClassSession',
        targetId: session._id,
        changes: {
            startDate: session.startDate,
            endDate: session.endDate,
            location: session.location,
            capacity: session.capacity,
        },
        metadata: { classId: req.params.classId, title: sessionTitle(session) },
    });

    send(res, 201, 'Session created', { session });
});

exports.roster = catchAsync(async (req, res) => {
    const roster = await sessionService.getRoster(req.params.sessionId);
    send(res, 200, 'Roster retrieved', roster);
});

exports.mark = catchAsync(async (req, res) => {
    const result = await sessionService.markAttendance({
        sessionId: req.params.sessionId,
        records: req.body.records,
        markedBy: req.user.id,
    });
    await auditService.writeAuditLog({
        req,
        action: 'ATTENDANCE_MARKED',
        targetType: 'ClassSession',
        targetId: req.params.sessionId,
        changes: {
            recordsCount: result.recordsCount,
            summary: result.summary,
        },
        metadata: { sessionId: req.params.sessionId },
    });

    send(res, 200, 'Attendance saved', {});
});

exports.transferOptions = catchAsync(async (req, res) => {
    const options = await sessionService.getTransferOptions(req.user.id);
    send(res, 200, 'Transfer options retrieved', options);
});

exports.requestTransfer = catchAsync(async (req, res) => {
    const transfer = await sessionService.requestTransfer({
        userId: req.user.id,
        payload: req.body,
    });

    send(res, 201, 'Transfer requested', { transfer });
});

exports.transfers = catchAsync(async (req, res) => {
    const result = await sessionService.listTransfers({
        user: req.user,
        ...parsePagination(req.query),
    });
    send(res, 200, 'Transfers retrieved', result);
});

exports.process = catchAsync(async (req, res) => {
    const transfer = await sessionService.processTransfer({
        transferId: req.params.id,
        status: req.body.status,
        adminId: req.user.id,
    });
    await auditService.writeAuditLog({
        req,
        action: 'SESSION_TRANSFER_PROCESSED',
        targetType: 'SessionTransfer',
        targetId: transfer._id,
        changes: { status: { from: 'pending', to: transfer.status } },
        metadata: {
            studentName: transfer.user?.name,
            studentEmail: transfer.user?.email,
            fromClass: transfer.fromSession?.class?.title,
            targetClass: transfer.targetClass?.title,
            targetStartDate: transfer.targetStartDate,
        },
    });

    send(res, 200, 'Transfer updated', { transfer });
});
