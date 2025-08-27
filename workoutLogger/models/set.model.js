// Defining model

module.exports = (sequelize, DataTypes) => {
    const Set = sequelize.define('Set', {
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
    }, {
        tableName: 'sets'
    });

    // Associations

    Set.associate = (db) => {
        db.Set.hasMany(db.ExerciseLog, { foreignKey: 'setId' });
    };

    return Set;
};
