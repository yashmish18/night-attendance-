module.exports = (sequelize, DataTypes) => {
    const Geofence = sequelize.define('Geofence', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: false
        },
        longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: false
        },
        sequence_order: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });
    return Geofence;
};
