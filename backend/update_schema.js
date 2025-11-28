const db = require('./models');

async function updateSchema() {
    try {
        const queryInterface = db.sequelize.getQueryInterface();

        // Add hostel to Wardens
        try {
            await queryInterface.addColumn('Wardens', 'hostel', {
                type: db.Sequelize.STRING,
                allowNull: true
            });
            console.log('Added hostel to Wardens');
        } catch (e) {
            console.log('hostel column might already exist in Wardens');
        }

        // Add image to FaceEnrollments
        try {
            await queryInterface.addColumn('FaceEnrollments', 'image', {
                type: db.Sequelize.TEXT('long'),
                allowNull: true
            });
            console.log('Added image to FaceEnrollments');
        } catch (e) {
            console.log('image column might already exist in FaceEnrollments');
        }

        // Update default warden
        await db.Warden.update({ hostel: 'BH-2' }, { where: { email: 'warden@jklu.edu.in' } });
        console.log('Updated default warden hostel to BH-2');

    } catch (error) {
        console.error('Schema update failed:', error);
    } finally {
        process.exit();
    }
}

updateSchema();
