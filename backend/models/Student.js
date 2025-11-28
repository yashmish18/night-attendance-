module.exports = (sequelize, DataTypes) => {
    const Student = sequelize.define('Student', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        reg_no: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        room_no: {
            type: DataTypes.STRING,
            allowNull: true
        },
        hostel: {
            type: DataTypes.STRING,
            allowNull: true
        },
        mobile: {
            type: DataTypes.STRING,
            allowNull: true
        },
        floor: {
            type: DataTypes.STRING,
            allowNull: true
        },
        seater: {
            type: DataTypes.STRING,
            allowNull: true
        },
        ac_status: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });
    return Student;
};
