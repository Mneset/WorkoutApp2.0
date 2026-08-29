module.exports = (sequelize, DataTypes) => {
    const SessionTemplate = sequelize.define ('SessionTemplate', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull:false
        },
        dayOffset: {
            type: DataTypes.INTEGER,
            field: 'days_offset',
            allowNull: false,
            defaultValue: 0
        },
        // Null for standalone templates (which are owned via user_id instead).
        workout_plan_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'workoutplan',
                key: 'id'
            }
        },
        // Owner of a standalone template; null for plan templates.
        userId: {
            type: DataTypes.STRING,
            field: 'user_id',
            allowNull: true
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'sessiontemplate',
    });

    SessionTemplate.associate = (models) => {
        SessionTemplate.belongsTo(models.WorkoutPlan, { foreignKey: 'workout_plan_id'});
        SessionTemplate.hasMany(models.ExerciseTemplate, { foreignKey: 'session_template_id', onDelete: 'CASCADE' });
    };

    return SessionTemplate;
}