const express = require('express');
const router = express.Router();
const controller = require('../controllers/attendanceController');
const { verifyToken, verifyWarden } = require('../middleware/authMiddleware');

router.post('/', verifyToken, controller.markAttendance);
router.get('/student', verifyToken, controller.getStudentHistory);
router.get('/warden', verifyWarden, controller.getWardenStats);
router.get('/geofence', controller.getGeofence);

module.exports = router;
