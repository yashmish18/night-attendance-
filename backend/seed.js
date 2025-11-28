const fs = require('fs');
const csv = require('csv-parser');
const db = require('./models');
const path = require('path');
const bcrypt = require('bcrypt');

const seedData = async () => {
    try {
        await db.sequelize.sync({ force: true });
        console.log('Database synced. Tables dropped and recreated.');

        // 1. Create Warden
        const hashedPassword = await bcrypt.hash('123', 10);
        await db.Warden.create({
            name: 'Warden',
            email: 'warden@jklu.edu.in',
            password: hashedPassword,
            hostel: 'BH-2'
        });
        console.log('Warden created.');

        // 2. Seed Geofence
        const coordinatesPath = 'd:/vista-2/night-attendance-system/frontend/public/coordinates.csv';
        const geofencePoints = [];

        if (fs.existsSync(coordinatesPath)) {
            fs.createReadStream(coordinatesPath)
                .pipe(csv())
                .on('data', (row) => {
                    if (row.Latitude && row.Longitude) {
                        geofencePoints.push({
                            latitude: parseFloat(row.Latitude),
                            longitude: parseFloat(row.Longitude),
                            sequence_order: geofencePoints.length
                        });
                    }
                })
                .on('end', async () => {
                    if (geofencePoints.length > 0) {
                        await db.Geofence.bulkCreate(geofencePoints);
                        console.log(`Seeded ${geofencePoints.length} geofence points.`);
                    }
                });
        } else {
            console.error('Coordinates CSV not found at:', coordinatesPath);
        }

        // 3. Seed Students
        const studentsPath = 'd:/vista-2/night-attendance-system/frontend/public/FINAL SHEET OF BH-2.csv';
        const students = [];
        const emailMap = new Map();

        if (fs.existsSync(studentsPath)) {
            const stream = fs.createReadStream(studentsPath);

            stream.pipe(csv({ skipLines: 2 }))
                .on('data', (row) => {
                    const name = row["Student's Name"];
                    const regNo = row["Student Reg. no"];
                    const roomNo = row["Room NO."];
                    const hostel = row["Hostel"];
                    const mobile = row["Mobile Number"];
                    const floor = row["Floor"];
                    const seater = row["Seater"];
                    const acStatus = row["AC/NAC"];

                    if (name && regNo && regNo !== '0' && regNo !== 0) {
                        const firstName = name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
                        let email = `${firstName}@jklu.edu.in`;

                        if (emailMap.has(email)) {
                            let count = emailMap.get(email) + 1;
                            emailMap.set(email, count);
                            email = `${firstName}${count}@jklu.edu.in`;
                        } else {
                            emailMap.set(email, 0);
                        }

                        // Check if regNo already exists in students array
                        const existingStudent = students.find(s => s.reg_no === regNo);
                        if (!existingStudent) {
                            students.push({
                                name: name,
                                reg_no: regNo,
                                email: email,
                                password: '123',
                                room_no: roomNo,
                                hostel: hostel,
                                mobile: mobile,
                                floor: floor,
                                seater: seater,
                                ac_status: acStatus
                            });
                        }
                    }
                })
                .on('end', async () => {
                    if (students.length > 0) {
                        try {
                            console.log(`Attempting to seed ${students.length} unique students...`);
                            await db.Student.bulkCreate(students, {
                                ignoreDuplicates: true
                            });
                            console.log(`Seeded students successfully.`);
                        } catch (err) {
                            console.error('Error seeding students:', err);
                        }
                    }
                    console.log('Seeding completed.');
                });
        } else {
            console.error('Students CSV not found at:', studentsPath);
        }

    } catch (error) {
        console.error('Seeding error:', error);
    }
};

if (require.main === module) {
    seedData();
}

module.exports = seedData;
