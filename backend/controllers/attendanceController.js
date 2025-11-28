const db = require('../models');
const Attendance = db.Attendance;
const Student = db.Student;
const { isInsideCampus } = require('../utils/geofence');

const FaceEnrollment = db.FaceEnrollment;

function getEuclideanDistance(face1, face2) {
    if (!face1 || !face2 || face1.length !== face2.length) return 1.0;
    let sum = 0;
    for (let i = 0; i < face1.length; i++) {
        sum += (face1[i] - face2[i]) ** 2;
    }
    return Math.sqrt(sum);
}

exports.markAttendance = async (req, res) => {
    try {
        const { lat, lng, faceDescriptor } = req.body;
        console.log(`[markAttendance] Received request. Image size: ${req.body.image ? req.body.image.length : 'MISSING'}`);
        const studentId = req.userId;

        // 1. Geofence Check
        // const inside = await isInsideCampus(lat, lng);
        // if (!inside) {
        //     return res.status(400).json({ message: 'You are outside the campus boundary. Attendance cannot be marked.' });
        // }

        // 2. Face Match Check
        const enrollment = await FaceEnrollment.findOne({ where: { student_id: studentId } });
        if (!enrollment) {
            return res.status(400).json({ message: 'Face not enrolled. Please enroll first.' });
        }

        const storedDescriptor = enrollment.face_descriptor;
        // Ensure descriptors are arrays
        const dist = getEuclideanDistance(Object.values(faceDescriptor), Object.values(storedDescriptor));

        if (dist > 0.6) { // 0.6 is a typical threshold for face-api.js (lower is better)
            return res.status(400).json({ message: `Face verification failed. Match score: ${dist.toFixed(2)} (Threshold: 0.6)` });
        }

        // 3. Mark Attendance
        // Use IST time
        const now = new Date();
        const istTime = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });
        const [datePart, timePart] = istTime.split(', ');
        // istTime format is usually "M/D/YYYY, HH:mm:ss" depending on locale, but let's be safer with Date object for date
        // Actually, let's just use the Date object for date, and formatted string for time.

        const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const hours = istDate.getHours();

        // Check for duplicate attendance
        const startOfIstDay = new Date(istDate);
        startOfIstDay.setHours(0, 0, 0, 0);
        const endOfIstDay = new Date(istDate);
        endOfIstDay.setHours(23, 59, 59, 999);

        const existingAttendance = await Attendance.findOne({
            where: {
                student_id: studentId,
                date: {
                    [db.Sequelize.Op.between]: [startOfIstDay, endOfIstDay]
                }
            }
        });

        if (existingAttendance) {
            return res.status(400).json({ message: 'Attendance already marked for today.' });
        }

        let status = 'Present';
        if (hours >= 22) { // 10 PM
            status = 'Late';
        }

        const attendance = await Attendance.create({
            student_id: studentId,
            date: istDate,
            time: istDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            status: status,
            location_lat: lat,
            location_long: lng,
            face_match_score: 1 - dist,
            captured_image: req.body.image // Save captured image
        });

        res.status(200).send({
            message: 'Attendance marked successfully!',
            data: attendance,
            matchScore: (1 - dist).toFixed(2)
        });

    } catch (error) {
        console.error("Attendance Error:", error);
        res.status(500).send({ message: error.message });
    }
};

exports.getStudentHistory = async (req, res) => {
    try {
        const studentId = req.userId;
        const history = await Attendance.findAll({
            where: { student_id: studentId },
            order: [['date', 'DESC'], ['time', 'DESC']]
        });
        res.status(200).send(history);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.getWardenStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const todaysAttendance = await Attendance.findAll({
            where: {
                date: {
                    [db.Sequelize.Op.between]: [startOfDay, endOfDay]
                }
            },
            include: [{
                model: Student,
                attributes: ['name', 'reg_no', 'room_no', 'hostel', 'mobile', 'email']
            }]
        });

        console.log(`[getWardenStats] Found ${todaysAttendance.length} records.`);
        if (todaysAttendance.length > 0) {
            console.log(`[getWardenStats] First record image length: ${todaysAttendance[0].captured_image ? todaysAttendance[0].captured_image.length : 'NULL'}`);
        }

        const totalStudents = await Student.count();
        const presentCount = todaysAttendance.length;

        res.status(200).send({
            totalStudents,
            presentCount,
            absentCount: totalStudents - presentCount,
            attendanceList: todaysAttendance
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.getGeofence = async (req, res) => {
    console.log('Fetching geofence...');
    try {
        const geofence = await db.Geofence.findAll({
            order: [['sequence_order', 'ASC']]
        });
        console.log(`Found ${geofence.length} geofence points.`);
        res.status(200).send(geofence);
    } catch (error) {
        console.error('Error fetching geofence:', error);
        res.status(500).send({ message: error.message });
    }
};
