const db = require('./models');

const checkDb = async () => {
    try {
        const studentCount = await db.Student.count();
        const wardenCount = await db.Warden.count();
        const geofenceCount = await db.Geofence.count();
        const attendanceCount = await db.Attendance.count();

        console.log('--- Database Status ---');
        console.log(`Students: ${studentCount}`);
        console.log(`Wardens: ${wardenCount}`);
        console.log(`Geofence Points: ${geofenceCount}`);
        console.log(`Attendance Records: ${attendanceCount}`);

    } catch (error) {
        console.error('Error checking DB:', error);
    }
};

checkDb();
