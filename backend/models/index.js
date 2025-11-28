const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Student = require('./Student')(sequelize, Sequelize);
db.Warden = require('./Warden')(sequelize, Sequelize);
db.Attendance = require('./Attendance')(sequelize, Sequelize);
db.Geofence = require('./Geofence')(sequelize, Sequelize);
db.FaceEnrollment = require('./FaceEnrollment')(sequelize, Sequelize);
db.Issue = require('./Issue')(sequelize, Sequelize);

// Associations
db.Student.hasMany(db.Attendance, { foreignKey: 'student_id' });
db.Attendance.belongsTo(db.Student, { foreignKey: 'student_id' });

db.Student.hasOne(db.FaceEnrollment, { foreignKey: 'student_id' });
db.FaceEnrollment.belongsTo(db.Student, { foreignKey: 'student_id' });

db.Student.hasMany(db.Issue, { foreignKey: 'student_id' });
db.Issue.belongsTo(db.Student, { foreignKey: 'student_id' });

module.exports = db;
