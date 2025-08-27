module.exports = (sequelize, DataTypes) => {
    const TargetMuscle = sequelize.define('TargetMuscle', {
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
        tableName: 'targetmuscles'
    });

    // Associations

    TargetMuscle.associate = (db) => {
        db.TargetMuscle.belongsToMany(db.Exercise, { through: db.ExerciseTargetMuscle, foreignKey: 'targetMuscleId' });
    }

    return TargetMuscle;
};