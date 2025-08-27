module.exports = (sequelize, DataTypes) => {
    const Role = sequelize.define('Role', {
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
        tableName: 'role' 
    });

    // Associations

    Role.associate = (db) => {
        db.Role.hasMany(db.User, { foreignKey: 'roleId' });
    }

    return Role;
};



