const db = require('./models');

async function getSamples() {
    try {
        const warden = await db.Warden.findOne();
        const students = await db.Student.findAll({ limit: 3 });

        console.log('--- SAMPLE CREDENTIALS ---');
        if (warden) {
            console.log(`WARDEN: ${warden.email} / 123`);
        }
        students.forEach(s => {
            console.log(`STUDENT: ${s.email} / 123`);
        });
        console.log('--------------------------');
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

getSamples();
