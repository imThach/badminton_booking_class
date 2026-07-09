const express = require('express');
const authRoutes = require('./authRoute');
const classRoutes = require('./classRoute');
const enrollmentRoutes = require('./enrollmentRoute');
const experienceRoutes = require('./experienceRoute');
const paymentRoutes = require('./paymentRoute');
const notificationRoutes = require('./notificationRoute');
const auditRoutes = require('./auditRoute');
const coachRoutes = require('./coachRoute');
const dashboardRoutes = require('./dashboardRoute');
const sessionRoutes = require('./sessionRoute');

const router = express.Router();

router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API is healthy',
    });
});

router.use('/auth', authRoutes);
router.use('/classes', classRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/experience', experienceRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/coaches', coachRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/sessions', sessionRoutes);

module.exports = router;
