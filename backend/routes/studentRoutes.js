const express = require('express');
const router = express.Router();
const controller = require('../controllers/studentController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/enroll-face', verifyToken, controller.enrollFace);
router.get('/profile', verifyToken, controller.getStudentProfile);
router.get('/all', verifyToken, controller.getAllStudents);
router.get('/face/:id', verifyToken, controller.getStudentFace);

module.exports = router;
