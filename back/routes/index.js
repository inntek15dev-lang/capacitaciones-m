const express = require('express');
const router = express.Router();

const authRouter = require('./auth');
const coursesRouter = require('./courses');
const schedulesRouter = require('./schedules');
const requestsRouter = require('./requests');
const workersRouter = require('./workers');
const dataRouter = require('./data');
const certificatesRouter = require('./certificates');

// Health Check
router.get('/health', (req, res) => res.json({ status: 'ok', version: '2.0-proxy-priority' }));

// Sub-routers mounting
router.use('/auth', authRouter);
router.use('/courses', coursesRouter);
router.use('/', schedulesRouter); // Handles /schedules, /enroll, /enrollments/evaluation
router.use('/requests', requestsRouter);
router.use('/', workersRouter); // Handles /external/workers
router.use('/data', dataRouter);
router.use('/certificates', certificatesRouter);

module.exports = router;
