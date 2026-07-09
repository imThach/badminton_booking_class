const sessionService = require('../services/sessionService');
const catchAsync = require('../utils/catchAsync');
const send = require('../utils/sendResponse');

exports.list = catchAsync(async (req, res) => {
    const sessions = await sessionService.listSessions(req.params.classId);
    send(res, 200, 'Sessions retrieved', { sessions });
});

exports.generate = catchAsync(async (req, res) => {
    const sessions = await sessionService.generateSessions(req.params.classId);
    send(res, 200, 'Sessions generated', { sessions });
});

exports.create = catchAsync(async (req, res) => {
    const session = await sessionService.createSession({
        classId: req.params.classId,
        payload: req.body,
    });

    send(res, 201, 'Session created', { session });
});

exports.roster = catchAsync(async (req, res) => {
    const roster = await sessionService.getRoster(req.params.sessionId);
    send(res, 200, 'Roster retrieved', roster);
});

exports.mark = catchAsync(async (req, res) => {
    await sessionService.markAttendance({
        sessionId: req.params.sessionId,
        records: req.body.records,
        markedBy: req.user.id,
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
    const transfers = await sessionService.listTransfers(req.user);
    send(res, 200, 'Transfers retrieved', { transfers });
});

exports.process = catchAsync(async (req, res) => {
    const transfer = await sessionService.processTransfer({
        transferId: req.params.id,
        status: req.body.status,
        adminId: req.user.id,
    });

    send(res, 200, 'Transfer updated', { transfer });
});
