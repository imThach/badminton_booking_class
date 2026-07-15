const mongoose = require('mongoose');
const Session = require('../models/ClassSession');
const Attendance = require('../models/Attendance');
const Transfer = require('../models/SessionTransfer');
const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const generator = require('./sessionGeneratorService');
const AppError = require('../utils/appError');

const activeEnrollmentFilter = { $or: [{ status: 'active' }, { status: { $exists: false } }] };
const transferPayloadFields = ['fromSession', 'targetClass', 'targetStartDate', 'targetEndDate', 'reason'];
const attendanceStatuses = ['present', 'absent', 'late', 'excused'];

const assertValidObjectId = (value, message = 'Invalid id') => {
    if (!mongoose.isValidObjectId(value)) {
        throw new AppError(message, 400);
    }
};

const parseDate = (value) => new Date(value);

exports.listSessions = async (classId) => {
    assertValidObjectId(classId);
    return Session.find({ class: classId }).sort('startDate');
};

exports.generateSessions = (classId) => generator.generate(classId);

exports.createSession = async ({ classId, payload }) => {
    assertValidObjectId(classId);

    const classDetail = await Class.findById(classId);
    if (!classDetail) {
        throw new AppError('Class not found', 404);
    }

    const startDate = parseDate(payload.startDate);
    const endDate = parseDate(payload.endDate);

    if (Number.isNaN(startDate.getTime()) || endDate <= startDate || startDate < classDetail.startDate || endDate > classDetail.endDate) {
        throw new AppError('Session must be inside the class date range', 400);
    }

    return Session.create({
        class: classDetail._id,
        startDate,
        endDate,
        location: payload.location || classDetail.location,
        capacity: payload.capacity || classDetail.maxStudents,
    });
};

exports.getRoster = async (sessionId) => {
    assertValidObjectId(sessionId);

    const session = await Session.findById(sessionId);
    if (!session) {
        throw new AppError('Session not found', 404);
    }

    const [enrollments, incoming, attendance] = await Promise.all([
        Enrollment.find({ class: session.class, ...activeEnrollmentFilter }).populate('user', 'name email'),
        Transfer.find({ toSession: session._id, status: 'approved' }).populate('user', 'name email'),
        Attendance.find({ session: session._id }),
    ]);

    const users = [...enrollments.map((enrollment) => enrollment.user), ...incoming.map((transfer) => transfer.user)];
    const uniqueUsers = [...new Map(users.filter(Boolean).map((user) => [String(user._id), user])).values()];

    return {
        session,
        students: uniqueUsers.map((user) => ({
            user,
            attendance: attendance.find((record) => String(record.user) === String(user._id)) || null,
        })),
    };
};

exports.markAttendance = async ({ sessionId, records, markedBy }) => {
    assertValidObjectId(sessionId);

    if (!Array.isArray(records)) {
        throw new AppError('records is required', 400);
    }

    const summary = {};
    for (const record of records) {
        if (!attendanceStatuses.includes(record.status)) {
            throw new AppError('Invalid attendance status', 400);
        }
        summary[record.status] = (summary[record.status] || 0) + 1;

        await Attendance.findOneAndUpdate(
            { session: sessionId, user: record.userId },
            {
                status: record.status,
                note: String(record.note || '').trim(),
                markedBy,
                markedAt: new Date(),
            },
            { upsert: true, runValidators: true }
        );
    }

    return { recordsCount: records.length, summary };
};

exports.getTransferOptions = async (userId) => {
    const enrollments = await Enrollment.find({
        user: userId,
        ...activeEnrollmentFilter,
    }).populate('class');

    const enrolledClasses = enrollments.map((enrollment) => enrollment.class).filter(Boolean);
    const levels = [...new Set(enrolledClasses.map((classItem) => classItem.level))];
    const absences = await Attendance.find({ user: userId, status: 'absent' }).select('session');
    const handled = await Transfer.find({ user: userId, status: { $in: ['pending', 'approved'] } }).select('fromSession');

    const blocked = new Set(handled.map((transfer) => String(transfer.fromSession)));
    const cutoff = new Date(Date.now() - 7 * 86400000);

    const [sourceDocs, targetClasses] = await Promise.all([
        Session.find({ _id: { $in: absences.map((absence) => absence.session) }, startDate: { $gte: cutoff, $lte: new Date() } })
            .sort('-startDate')
            .populate('class', 'title level'),
        Class.find({ level: { $in: levels }, endDate: { $gt: new Date() } }),
    ]);

    return {
        sources: sourceDocs.filter((session) => !blocked.has(String(session._id))),
        targets: targetClasses.flatMap((classItem) => generator.projectUpcoming(classItem, 14)),
    };
};

exports.requestTransfer = async ({ userId, payload }) => {
    if (Object.keys(payload || {}).some((key) => !transferPayloadFields.includes(key))) {
        throw new AppError('Invalid transfer payload', 400);
    }

    assertValidObjectId(payload.fromSession);
    assertValidObjectId(payload.targetClass);

    const reason = String(payload.reason || '').trim();
    if (reason.length < 10 || reason.length > 500) {
        throw new AppError('Reason must contain 10 to 500 characters', 400);
    }

    const from = await Session.findById(payload.fromSession).populate('class');
    const targetClass = await Class.findById(payload.targetClass);
    const targetStartDate = parseDate(payload.targetStartDate);
    const targetEndDate = parseDate(payload.targetEndDate);
    const now = new Date();

    if (!from || !targetClass || Number.isNaN(targetStartDate.getTime()) || targetStartDate <= now || targetEndDate <= targetStartDate) {
        throw new AppError('Invalid transfer session', 400);
    }

    if (String(from.class._id) === String(targetClass._id)) {
        throw new AppError('Target session must belong to another class', 400);
    }

    if (from.class.level !== targetClass.level) {
        throw new AppError('Target class must have the same level', 400);
    }

    if (from.startDate < new Date(Date.now() - 7 * 86400000)) {
        throw new AppError('Transfer requests must be submitted within 7 days of the missed session', 400);
    }

    const isEnrolled = await Enrollment.exists({ class: from.class._id, user: userId, ...activeEnrollmentFilter });
    if (!isEnrolled) {
        throw new AppError('Not enrolled in source class', 403);
    }

    const hasAbsentRecord = await Attendance.exists({ session: from._id, user: userId, status: 'absent' });
    if (!hasAbsentRecord) {
        throw new AppError('Only an absent session can be transferred', 400);
    }

    const targetStillAvailable = generator
        .projectUpcoming(targetClass, 14)
        .some((session) => session.startDate.getTime() === targetStartDate.getTime());
    if (!targetStillAvailable) {
        throw new AppError('Target session is no longer available', 409);
    }

    const [base, incoming, existing, conflict] = await Promise.all([
        Enrollment.countDocuments({ class: targetClass._id, ...activeEnrollmentFilter }),
        Transfer.countDocuments({ targetClass: targetClass._id, targetStartDate, status: 'approved' }),
        Transfer.exists({ user: userId, fromSession: from._id, status: { $in: ['pending', 'approved'] } }),
        Transfer.exists({ user: userId, targetStartDate, status: { $in: ['pending', 'approved'] } }),
    ]);

    if (base + incoming >= targetClass.maxStudents) {
        throw new AppError('Target session is full', 409);
    }

    if (existing) {
        throw new AppError('This missed session already has a transfer request', 409);
    }

    if (conflict) {
        throw new AppError('You already have a transfer request for the target time', 409);
    }

    return Transfer.create({
        user: userId,
        fromSession: from._id,
        targetClass: targetClass._id,
        targetStartDate,
        targetEndDate,
        reason,
    });
};

exports.listTransfers = (user) => Transfer.find(user.role === 'admin' ? {} : { user: user.id })
    .sort('-createdAt')
    .populate('user', 'name email')
    .populate('targetClass', 'title level')
    .populate({ path: 'fromSession', populate: { path: 'class', select: 'title' } })
    .populate({ path: 'toSession', populate: { path: 'class', select: 'title' } });

exports.processTransfer = async ({ transferId, status, adminId }) => {
    assertValidObjectId(transferId);

    if (!['approved', 'rejected'].includes(status)) {
        throw new AppError('Invalid status', 400);
    }

    const transfer = await Transfer.findOne({ _id: transferId, status: 'pending' }).populate('targetClass');
    if (!transfer) {
        throw new AppError('Pending request not found', 404);
    }

    if (status === 'approved' && transfer.targetStartDate <= new Date()) {
        throw new AppError('Target session has already started', 409);
    }

    const sourceStillAbsent = await Attendance.exists({ session: transfer.fromSession, user: transfer.user, status: 'absent' });
    if (status === 'approved' && !sourceStillAbsent) {
        throw new AppError('The source session is no longer marked absent', 409);
    }

    if (status === 'approved') {
        const [base, incoming] = await Promise.all([
            Enrollment.countDocuments({ class: transfer.targetClass._id, ...activeEnrollmentFilter }),
            Transfer.countDocuments({ _id: { $ne: transfer._id }, targetClass: transfer.targetClass._id, targetStartDate: transfer.targetStartDate, status: 'approved' }),
        ]);

        if (base + incoming >= transfer.targetClass.maxStudents) {
            throw new AppError('Target session is full', 409);
        }

        transfer.toSession = (await Session.findOneAndUpdate(
            { class: transfer.targetClass._id, startDate: transfer.targetStartDate },
            {
                $setOnInsert: {
                    class: transfer.targetClass._id,
                    startDate: transfer.targetStartDate,
                    endDate: transfer.targetEndDate,
                    location: transfer.targetClass.location,
                    capacity: transfer.targetClass.maxStudents,
                    origin: 'transfer',
                },
            },
            { new: true, upsert: true }
        ))._id;

        await Attendance.findOneAndUpdate(
            { session: transfer.fromSession, user: transfer.user },
            { status: 'excused', note: 'Transferred to another session', markedBy: adminId },
            { upsert: true }
        );
    }

    transfer.status = status;
    transfer.processedBy = adminId;
    transfer.processedAt = new Date();
    await transfer.save();

    return transfer.populate([
        { path: 'user', select: 'name email' },
        { path: 'targetClass', select: 'title level' },
        { path: 'fromSession', populate: { path: 'class', select: 'title' } },
        { path: 'toSession', populate: { path: 'class', select: 'title' } },
    ]);
};
