module.exports = (sequelize, DataTypes) => {
    const ExerciseTemplate = sequelize.define('ExerciseTemplate', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        sessionTemplateId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'sessionTemplate',
                key: 'id'
            }
        },
        exerciseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'exercises',
                key: 'id'
            }
        },
        orderIndex: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        baseSets: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        baseReps: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        baseWeight: {
            type: DataTypes.FLOAT,
            allowNull: true
        }
    }, {
        tableName: 'exercisetemplate',
    })

    ExerciseTemplate.associate = (models) => {
        ExerciseTemplate.belongsTo(models.Exercise, { foreignKey: 'exerciseId' });
        ExerciseTemplate.belongsTo(models.SessionTemplate, { foreignKey: 'sessionTemplateId' });
    }

    return ExerciseTemplate;
}

