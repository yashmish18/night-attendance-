const db = require('./models');

async function debugUser() {
    try {
        await db.sequelize.authenticate();
        console.log('DB Connected.');

        // Get first student
        const student = await db.Student.findOne();
        if (!student) {
            console.log('No students found.');
            return;
        }
        console.log(`Testing with Student ID: ${student.id}`);

        // Test Profile Fetch (like getStudentProfile)
        console.log('Fetching Profile...');
        const profile = await db.Student.findByPk(student.id, {
            attributes: { exclude: ['password'] },
            include: [{ model: db.FaceEnrollment }]
        });
        console.log('Profile fetched successfully:', profile ? profile.name : 'null');
        if (profile && profile.FaceEnrollment) {
            console.log('Face Enrollment found.');
        } else {
            console.log('No Face Enrollment.');
        }

        // Test History Fetch (like getStudentHistory)
        console.log('Fetching History...');
        const history = await db.Attendance.findAll({
            where: { student_id: student.id },
            order: [['date', 'DESC'], ['time', 'DESC']]
        });
        console.log(`History fetched successfully. Count: ${history.length}`);

    } catch (error) {
        console.error('DEBUG ERROR:', error);
    } finally {
        await db.sequelize.close();
    }
}

debugUser();
