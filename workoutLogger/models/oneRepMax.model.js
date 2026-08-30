module.exports = (sequelize, DataTypes) => {
    const OneRepMax = sequelize.define('OneRepMax', {
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
        exerciseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'exercise_id'
        },
        oneRm: {
            type: DataTypes.FLOAT,
            allowNull: false,
            field: 'one_rm'
        }
    }, {
        tableName: 'user_exercise_1rm',
        timestamps: false
    });

    OneRepMax.associate = (db) => {
        OneRepMax.belongsTo(db.Exercise, { foreignKey: 'exerciseId' });
    };

    return OneRepMax;
};
