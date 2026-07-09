const service = require('../services/experienceService');
const catchAsync = require('../utils/catchAsync');
const sendResponse = require('../utils/sendResponse');

exports.joinWaitlist = catchAsync(async (req, res) => sendResponse(res, 201, 'Added to waitlist', { entry: await service.joinWaitlist({ classId: req.params.classId, userId: req.user.id }) }));
exports.leaveWaitlist = catchAsync(async (req, res) => sendResponse(res, 200, 'Removed from waitlist', { entry: await service.leaveWaitlist({ classId: req.params.classId, userId: req.user.id }) }));
exports.myWaitlist = catchAsync(async (req, res) => sendResponse(res, 200, 'Waitlist retrieved', { entries: await service.getMyWaitlist(req.user.id) }));
exports.saveReview = catchAsync(async (req, res) => sendResponse(res, 200, 'Review saved', { review: await service.saveReview({ rating: req.body.rating, comment: req.body.comment, classId: req.params.classId, userId: req.user.id }) }));
exports.getReviews = catchAsync(async (req, res) => sendResponse(res, 200, 'Reviews retrieved', await service.getReviews(req.params.classId)));
exports.toggleBookmark = catchAsync(async (req, res) => sendResponse(res, 200, 'Bookmark updated', await service.toggleBookmark({ classId: req.params.classId, userId: req.user.id })));
exports.myBookmarks = catchAsync(async (req, res) => sendResponse(res, 200, 'Bookmarks retrieved', { bookmarks: await service.getBookmarks(req.user.id) }));
