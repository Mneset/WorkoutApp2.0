module.exports = (sequelize, DataTypes) => {
    const Exercise = sequelize.define('Exercise', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }      
    }, {
        tableName: 'exercises' 
    });

    // Associations

    Exercise.associate = (db) => {
        db.Exercise.hasMany(db.ExerciseLog, { foreignKey: 'exerciseId' });
        db.Exercise.belongsToMany(db.Category, { through: db.ExerciseCategory, foreignKey: 'exerciseId' });
        db.Exercise.belongsToMany(db.Equipment, { through: db.ExerciseEquipment, foreignKey: 'exerciseId' });
        db.Exercise.belongsToMany(db.TargetMuscle, { through: db.ExerciseTargetMuscle, foreignKey: 'exerciseId' });
    }
    return Exercise;
};