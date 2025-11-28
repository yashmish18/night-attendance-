module.exports = (sequelize, DataTypes) => {
    const FaceEnrollment = sequelize.define('FaceEnrollment', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        face_descriptor: {
            type: DataTypes.JSON, // Storing as JSON array
            allowNull: false
        },
        image: {
            type: DataTypes.TEXT('long'), // Store Base64 image
            allowNull: true
        }
    });
    return FaceEnrollment;
};
