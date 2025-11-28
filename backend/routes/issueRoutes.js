const express = require('express');
const router = express.Router();
const controller = require('../controllers/issueController');
const { verifyToken, verifyWarden } = require('../middleware/authMiddleware');

router.post('/', verifyToken, controller.reportIssue);
router.get('/', verifyWarden, controller.getAllIssues);

module.exports = router;
