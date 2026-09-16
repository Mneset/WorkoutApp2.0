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
        // The plan's note for this set, shown read-only while logging. Separate from `notes`
        // so writing your own never destroys the prescribed one.
        targetNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'target_notes'
        },
        // The plan's note for the exercise as a whole, denormalised onto every set row (read
        // from the first) the same way is_timed and field_config are.
        targetExerciseNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'target_exercise_notes'
        },
        sessionLogId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'session_log_id'
        },
        // Whether the lifter has ticked this set off as done during the session.
        completed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        // Time-based (hold) set: logs duration_seconds instead of reps × weight.
        isTimed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_timed'
        },
        // { showRpe, showRir, showNotes } copied from the plan exercise when the session
        // was started. Null means this set was added freeform mid-session, in which case
        // the user's "while logging" profile prefs apply and the metric mode stays editable.
        fieldConfig: {
            type: DataTypes.JSON,
            allowNull: true,
            field: 'field_config'
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
