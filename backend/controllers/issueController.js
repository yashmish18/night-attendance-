const db = require('../models');
const Issue = db.Issue;

exports.reportIssue = async (req, res) => {
    try {
        const { type, description } = req.body;
        const studentId = req.userId;

        const issue = await Issue.create({
            student_id: studentId,
            type,
            description
        });

        res.status(201).send({ message: "Issue reported successfully.", data: issue });
    } catch (error) {
        console.error("Report Issue Error:", error);
        res.status(500).send({ message: error.message });
    }
};

exports.getAllIssues = async (req, res) => {
    try {
        const issues = await Issue.findAll({
            include: [{
                model: db.Student,
                attributes: ['name', 'reg_no', 'room_no']
            }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).send(issues);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};
