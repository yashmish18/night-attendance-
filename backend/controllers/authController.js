const db = require('../models');
const Student = db.Student;
const Warden = db.Warden;
const FaceEnrollment = db.FaceEnrollment;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { isInsideCampus } = require('../utils/geofence');

exports.login = async (req, res) => {
    try {
        const { email, password, lat, lng } = req.body;

        // 1. Check Warden Table
        let user = await Warden.findOne({ where: { email } });
        let role = 'warden';

        // 2. If not Warden, Check Student Table
        if (!user) {
            user = await Student.findOne({
                where: { email },
                include: [{ model: FaceEnrollment }]
            });
            role = 'student';
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check password
        let passwordIsValid = false;
        if (role === 'warden') {
            // Warden passwords are hashed
            passwordIsValid = await bcrypt.compare(password, user.password);
        } else {
            // Student passwords are plain text (as per seed.js)
            passwordIsValid = (user.password === password);
        }

        if (!passwordIsValid) {
            return res.status(401).json({ accessToken: null, message: 'Invalid Password!' });
        }

        // Geofence Check for Students
        if (role === 'student') {
            if (!lat || !lng) {
                return res.status(400).json({ message: 'Location access is required for login.' });
            }

            const inside = await isInsideCampus(lat, lng);
            if (!inside) {
                return res.status(403).json({ message: 'Access Denied: You are outside the designated campus area.' });
            }
        }

        const token = jwt.sign({ id: user.id, role: role }, process.env.JWT_SECRET, {
            expiresIn: 86400 // 24 hours
        });

        const faceDescriptor = (role === 'student' && user.FaceEnrollment) ? user.FaceEnrollment.face_descriptor : null;

        res.status(200).send({
            id: user.id,
            name: user.name,
            email: user.email,
            role: role,
            accessToken: token,
            face_descriptor: faceDescriptor
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};
