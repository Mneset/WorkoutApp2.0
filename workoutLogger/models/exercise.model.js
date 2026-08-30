module.exports = (sequelize, DataTypes) => {
    const Exercise = sequelize.define('Exercise', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        // 'strength' (reps × weight) or 'cardio' (duration + distance).
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'strength'
        },
        // Step-by-step instructions (array of strings) and image paths (loaded from the
        // jsDelivr CDN). Lazy-loaded via the details endpoint, kept out of the list query.
        instructions: {
            type: DataTypes.JSON,
            allowNull: true
        },
        images: {
            type: DataTypes.JSON,
            allowNull: true
        },
        // Part of the curated "basic" subset (common staples), for the profile filter.
        isBasic: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_basic'
        }
    }, {
        tableName: 'exercises' 
    });

    // Associations

    Exercise.associate = (db) => {
        db.Exercise.hasMany(db.ExerciseLog, { foreignKey: 'exerciseId' });
        db.Exercise.belongsToMany(db.Category, { through: db.ExerciseCategory, foreignKey: 'exerciseId' });
        db.Exercise.belongsToMany(db.Equipment, { through: db.ExerciseEquipment, foreignKey: 'exerciseId' });
        db.Exercise.belongsToMany(db.TargetMuscle, { through: db.ExerciseTargetMuscle, foreignKey: 'exerciseId' });
        db.Exercise.hasMany(db.ExerciseTemplate, { foreignKey: 'exerciseId' });
    }
    return Exercise;
};