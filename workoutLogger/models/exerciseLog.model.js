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
            allowNull: true
        },
        weight: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        // Per-exercise display order within the session (shared across an exercise's sets).
        orderIndex: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'order_index'
        },
        // Cardio metrics (null for strength logs).
        durationSeconds: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'duration_seconds'
        },
        distance: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        rpe: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        rir: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        // Prescription carried from a plan/template, shown as placeholders while logging.
        // target_reps is a string so it can hold a range ("8-12") or a single number.
        targetReps: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'target_reps'
        },
        targetWeight: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'target_weight'
        },
        // The percentage behind a %-of-1RM weight (e.g. 70), shown as a caption.
        targetWeightPct: {
            type: DataTypes.FLOAT,
            allowNull: true,
            field: 'target_weight_pct'
        },
        targetDurationSeconds: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'target_duration_seconds'
        },
        targetDistance: {
            type: DataTypes.FLOAT,
            allowNull: true,
            field: 'target_distance'
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
