const express = require('express');
const controller = require('../controllers/dashboardController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();
router.get('/overview', protect, restrictTo('admin'), controller.getOverview);
module.exports = router;
