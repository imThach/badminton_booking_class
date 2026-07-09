const mongoose = require('mongoose');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Waitlist = require('../models/Waitlist');
const Review = require('../models/Review');
const Bookmark = require('../models/Bookmark');
const ClassSession = require('../models/ClassSession');
const AppError = require('../utils/appError');

const getClass = async (classId) => {
    if (!mongoose.isValidObjectId(classId)) throw new AppError('Invalid class id', 400);
    const item = await Class.findById(classId);
    if (!item) throw new AppError('Class not found', 404);
    return item;
};

exports.joinWaitlist = async ({ classId, userId }) => {
    const item = await getClass(classId);
    if (item.startDate <= new Date()) throw new AppError('This class has already started', 400);
    if (item.currentStudents < item.maxStudents) throw new AppError('This class still has an available slot', 400);
    if (await Enrollment.exists({ class: classId, user: userId, $or: [{ status: { $in: ['active', 'pending_payment'] } }, { status: { $exists: false } }] })) throw new AppError('You are already enrolled', 409);
    try {
        return await Waitlist.create({ class: classId, user: userId });
    } catch (error) {
        if (error.code === 11000) throw new AppError('You are already on the waitlist', 409);
        throw error;
    }
};

exports.leaveWaitlist = async ({ classId, userId }) => {
    const entry = await Waitlist.findOneAndDelete({ class: classId, user: userId });
    if (!entry) throw new AppError('Waitlist entry not found', 404);
    return entry;
};

exports.getMyWaitlist = (userId) => Waitlist.find({ user: userId }).sort({ joinedAt: 1 }).populate('class');

exports.promoteNext = async (classId, session) => {
    const item = await Class.findById(classId).session(session);
    if (!item || item.startDate <= new Date()) return null;
    const next = await Waitlist.findOne({ class: classId }).sort({ joinedAt: 1 }).session(session);
    if (!next) return null;
    await Enrollment.create([{ class: classId, user: next.user }], { session });
    await Waitlist.deleteOne({ _id: next._id }).session(session);
    return next;
};

exports.saveReview = async ({ classId, userId, rating, comment }) => {
    const item = await getClass(classId);
    if (!await Enrollment.exists({ class: classId, user: userId, $or: [{ status: 'active' }, { status: { $exists: false } }] })) throw new AppError('Only enrolled students can review this class', 403);
    const completedSession = await ClassSession.exists({ class: classId, endDate: { $lte: new Date() }, status: { $ne: 'cancelled' } });
    if (!completedSession && (item.endDate || item.startDate) > new Date()) throw new AppError('You can review this class after a session has ended', 400);
    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
        throw new AppError('Rating must be an integer from 1 to 5', 400);
    }
    if (String(comment || '').trim().length > 1000) throw new AppError('Comment cannot exceed 1000 characters', 400);
    return Review.findOneAndUpdate(
        { class: classId, user: userId },
        { rating: Number(rating), comment: String(comment || '').trim() },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('user', 'name avatar');
};

exports.getReviews = async (classId) => {
    await getClass(classId);
    const reviews = await Review.find({ class: classId }).sort({ updatedAt: -1 }).populate('user', 'name avatar');
    const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
    return { reviews, averageRating: Number(averageRating.toFixed(1)) };
};

exports.toggleBookmark = async ({ classId, userId }) => {
    await getClass(classId);
    const existing = await Bookmark.findOneAndDelete({ class: classId, user: userId });
    if (existing) return { bookmarked: false };
    await Bookmark.create({ class: classId, user: userId });
    return { bookmarked: true };
};

exports.getBookmarks = (userId) => Bookmark.find({ user: userId }).sort({ createdAt: -1 }).populate('class');
