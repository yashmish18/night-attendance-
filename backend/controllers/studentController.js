const db = require('../models');
const Student = db.Student;
const FaceEnrollment = db.FaceEnrollment;

exports.enrollFace = async (req, res) => {
    try {
        const { face_descriptor, image } = req.body;
        const studentId = req.userId; // From verifyToken middleware

        if (!face_descriptor) {
            return res.status(400).send({ message: "Face descriptor is required." });
        }

        // Check if already enrolled
        let enrollment = await FaceEnrollment.findOne({ where: { student_id: studentId } });

        if (enrollment) {
            // Update existing
            enrollment.face_descriptor = face_descriptor;
            if (image) enrollment.image = image;
            await enrollment.save();
            return res.status(200).send({ message: "Face data updated successfully." });
        } else {
            // Create new
            await FaceEnrollment.create({
                student_id: studentId,
                face_descriptor: face_descriptor,
                image: image
            });
            return res.status(201).send({ message: "Face enrolled successfully." });
        }

    } catch (error) {
        console.error("Enrollment Error:", error);
        res.status(500).send({ message: error.message });
    }
};

exports.getStudentProfile = async (req, res) => {
    try {
        const student = await Student.findByPk(req.userId, {
            attributes: { exclude: ['password'] },
            include: [{ model: FaceEnrollment }]
        });

        if (!student) {
            return res.status(404).send({ message: "Student not found." });
        }

        res.status(200).send(student);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.getAllStudents = async (req, res) => {
    try {
        const { hostel } = req.query;
        const whereClause = {};

        if (hostel && hostel !== 'All') {
            whereClause.hostel = hostel;
        }

        const students = await Student.findAll({
            where: whereClause,
            attributes: { exclude: ['password'] },
            include: [{
                model: FaceEnrollment,
                attributes: { exclude: ['face_descriptor'] } // Exclude heavy data but keep image
            }]
        });
        res.status(200).send(students);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.getStudentFace = async (req, res) => {
    try {
        const studentId = req.params.id;
        const enrollment = await FaceEnrollment.findOne({
            where: { student_id: studentId },
            attributes: ['image']
        });

        if (!enrollment || !enrollment.image) {
            return res.status(404).send({ message: "Face image not found." });
        }

        res.status(200).send({ image: enrollment.image });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};
