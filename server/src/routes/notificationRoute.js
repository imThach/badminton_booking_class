const express = require('express');
const notificationController = require('../controllers/notificationController');

const router = express.Router();
router.post('/reminders/run', notificationController.runReminders);
module.exports = router;
