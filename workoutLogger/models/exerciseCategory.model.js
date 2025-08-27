module.exports = (sequelize, DataTypes) => {
    const ExerciseCategory = sequelize.define('ExerciseCategory', {
        exerciseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        categoryId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        }
    }, {
        tableName: 'exercisecategories',
    });

    // Associations

    ExerciseCategory.associate = (db) => {
        db.ExerciseCategory.belongsTo(db.Exercise, { foreignKey: 'exerciseId' });
        db.ExerciseCategory.belongsTo(db.Category, { foreignKey: 'categoryId' });
    };

    return ExerciseCategory;
};