module.exports = (sequelize, DataTypes) => {
    const Warden = sequelize.define('Warden', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
        hostel: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });
    return Warden;
};
