const mongoose = require('mongoose');
const Coach = require('../models/Coach');
const Class = require('../models/Class');
const AppError = require('../utils/appError');

const allowedFields = ['name', 'photo', 'bio', 'isActive'];
const pick = (payload = {}) => Object.fromEntries(
    allowedFields.filter((field) => payload[field] !== undefined).map((field) => [field, payload[field]])
);

const assertId = (id) => {
    if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid coach id', 400);
};

exports.list = async ({ includeInactive = false } = {}) => {
    const coaches = await Coach.find(includeInactive ? {} : { isActive: true }).sort({ isActive: -1, name: 1 }).lean();
    const activeClasses = await Class.find({
        coach: { $in: coaches.map((coach) => coach._id) },
        $or: [{ endDate: { $gte: new Date() } }, { endDate: { $exists: false }, startDate: { $gte: new Date() } }],
    }).select('coach title schedule startDate endDate').sort({ startDate: 1 }).lean();
    const classesByCoach = activeClasses.reduce((grouped, item) => {
        const coachId = item.coach.toString();
        if (!grouped[coachId]) grouped[coachId] = [];
        grouped[coachId].push(item);
        return grouped;
    }, {});
    return coaches.map((coach) => {
        const assignedClasses = classesByCoach[coach._id.toString()] || [];
        return { ...coach, assignedClasses, teachingSchedule: assignedClasses.map((item) => `${item.title}: ${item.schedule}`).join(' · ') };
    });
};

exports.create = (payload, userId) => Coach.create({ ...pick(payload), createdBy: userId });

exports.update = async (id, payload) => {
    assertId(id);
    const coach = await Coach.findByIdAndUpdate(id, pick(payload), { new: true, runValidators: true });
    if (!coach) throw new AppError('Coach not found', 404);
    if (payload.name !== undefined) await Class.updateMany({ coach: coach._id }, { coachName: coach.name });
    return coach;
};

exports.remove = async (id) => {
    assertId(id);
    const coach = await Coach.findById(id);
    if (!coach) throw new AppError('Coach not found', 404);
    const classCount = await Class.countDocuments({ coach: coach._id });
    if (classCount) throw new AppError(`Cannot delete this coach because they are assigned to ${classCount} class(es). Deactivate the coach instead.`, 400);
    await coach.deleteOne();
    return coach;
};
