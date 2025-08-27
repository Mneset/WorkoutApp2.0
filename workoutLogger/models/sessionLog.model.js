module.exports = (sequelize, DataTypes) => {
    const SessionLog = sequelize.define('SessionLog', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'user_id'
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: false
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        sessionDateStart: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'session_date_start'
        },
        sessionDateEnd: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'session_date_end'
        },
        workoutPlanId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'workout_plan_id'
        },
        sessionTemplateId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'session_template_id'
        },
        weekNumber: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'week_number'
        },
    }, {
        tableName: 'sessionlog'
    });

    // Associations

    SessionLog.associate = (db) => {
        db.SessionLog.belongsTo(db.User, { foreignKey: 'userId' });
        db.SessionLog.hasMany(db.ExerciseLog, { foreignKey: 'sessionLogId', onDelete: 'CASCADE' });
        db.SessionLog.belongsTo(db.WorkoutPlan, { foreignKey: 'workoutPlanId'})
        db.SessionLog.belongsTo(db.SessionTemplate, { foreignKey: 'sessionTemplateId' });
    }

    return SessionLog;
};

