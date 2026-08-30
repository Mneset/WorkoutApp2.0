module.exports = (sequelize, DataTypes) => {
    const FavoriteExercise = sequelize.define('FavoriteExercise', {
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
        }
    }, {
        tableName: 'user_favorite_exercises',
        timestamps: false
    });

    return FavoriteExercise;
};
