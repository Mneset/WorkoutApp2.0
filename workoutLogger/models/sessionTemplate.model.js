module.exports = (sequelize, DataTypes) => {
    const SessionTemplate = sequelize.define ('SessionTemplate', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull:false,
            unique: true
        },
        dayOffset: {
            type: DataTypes.INTEGER,
            field: 'days_offset',
            allowNull: false,
            defaultValue: 0
        },
        workout_plan_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'WorkoutPlan',
                key: 'id'
            }
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