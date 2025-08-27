module.exports = (sequelize, DataTypes) => {
    const ExerciseLog = sequelize.define('ExerciseLog', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        exerciseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'exercise_id'
        },
        setId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'sets_id'
        },
        reps: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        weight: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        sessionLogId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'session_log_id'
        }
    }, {
        tableName: 'exerciselog'
    }
);

    // Associations

    ExerciseLog.associate = (db) => {
        db.ExerciseLog.belongsTo(db.Exercise, { foreignKey: 'exerciseId' });
        db.ExerciseLog.belongsTo(db.SessionLog, { foreignKey: 'sessionLogId', onDelete: 'CASCADE' });
        db.ExerciseLog.belongsTo(db.Set, { foreignKey: 'setId' });
    }

    return ExerciseLog;
};
