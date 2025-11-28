module.exports = (sequelize, DataTypes) => {
    const Attendance = sequelize.define('Attendance', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        date: {
            type: DataTypes.DATEONLY,
            defaultValue: DataTypes.NOW
        },
        time: {
            type: DataTypes.TIME,
            defaultValue: DataTypes.NOW
        },
        status: {
            type: DataTypes.ENUM('Present', 'Absent', 'Late'),
            defaultValue: 'Present'
        },
        location_lat: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: false
        },
        location_long: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: false
        },
        face_match_score: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        captured_image: {
            type: DataTypes.TEXT('long'),
            allowNull: true
        }
    });
    return Attendance;
};
