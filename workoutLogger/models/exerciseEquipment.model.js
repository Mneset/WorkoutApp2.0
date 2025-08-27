module.exports = (sequelize, DataTypes) => {
    const ExerciseEquipment = sequelize.define('ExerciseEquipment', {
        exerciseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        equipmentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        }
    }, {
        tableName: 'exerciseequipment',
    });

    // Associations

    ExerciseEquipment.associate = (db) => {
        db.ExerciseEquipment.belongsTo(db.Exercise, { foreignKey: 'exerciseId' });
        db.ExerciseEquipment.belongsTo(db.Equipment, { foreignKey: 'equipmentId' });
    };

    return ExerciseEquipment;
};