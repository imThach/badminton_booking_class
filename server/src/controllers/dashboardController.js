const dashboardService = require('../services/dashboardService');
const catchAsync = require('../utils/catchAsync');
const sendResponse = require('../utils/sendResponse');

exports.getOverview = catchAsync(async (req, res) => {
    const overview = await dashboardService.getOverview();
    sendResponse(res, 200, 'Dashboard overview retrieved successfully', overview);
});
