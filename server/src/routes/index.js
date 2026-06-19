const express = require('express');
const authRoutes = require('./authRoute');
const classRoutes = require('./classRoute');
const enrollmentRoutes = require('./enrollmentRoute');

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

module.exports = router;
