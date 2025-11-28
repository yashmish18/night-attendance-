const db = require('./models');

async function testDB() {
    try {
        await db.sequelize.authenticate();
        console.log('Connection has been established successfully.');

        await db.sequelize.sync();
        console.log('Database synced.');

        const students = await db.Student.findAll();
        console.log(`Found ${students.length} students.`);

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await db.sequelize.close();
    }
}

testDB();
