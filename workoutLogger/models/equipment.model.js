module.exports = (sequelize, DataTypes) => {
    const Equipment = sequelize.define('Equipment', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
    }, {
        tableName: 'equipment' 
    }
);

    // Associations

    Equipment.associate = (db) => {
        db.Equipment.belongsToMany(db.Exercise, { through: db.ExerciseEquipment, foreignKey: 'equipmentId' });
    }

    return Equipment;
};