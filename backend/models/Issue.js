module.exports = (sequelize, DataTypes) => {
    const Issue = sequelize.define('Issue', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('Open', 'Resolved', 'Dismissed'),
            defaultValue: 'Open'
        }
    });
    return Issue;
};
