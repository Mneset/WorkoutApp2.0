module.exports = (sequelize, DataTypes) => {
    const ExerciseTargetMuscle = sequelize.define('ExerciseTargetMuscle', {
        exerciseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'exercise_id',
            primaryKey: true
        },
        targetMuscleId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'targetMuscle_id',
            primaryKey: true
        }
    }, {
        tableName: 'exercisetargetmuscles',
    } 
);

    // Associations

    ExerciseTargetMuscle.associate = (db) => {
        db.ExerciseTargetMuscle.belongsTo(db.Exercise, { foreignKey: 'exerciseId' });
        db.ExerciseTargetMuscle.belongsTo(db.TargetMuscle, { foreignKey: 'targetMuscleId' });
    };

    return ExerciseTargetMuscle;
};