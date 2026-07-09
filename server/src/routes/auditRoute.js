const express = require('express');
const auditController = require('../controllers/auditController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();
router.get('/', protect, restrictTo('admin'), auditController.getAuditLogs);
module.exports = router;
