module.exports = (sequelize, DataTypes) => {
    const WorkoutPlan =  sequelize.define('WorkoutPlan', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name:{
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        durationWeeks: {
            type: DataTypes.INTEGER,
            allowNull: false
        }, 
    }, {
        tableName: 'workoutplan'
    });

    WorkoutPlan.associate = (db) => {
        db.WorkoutPlan.hasMany(db.SessionLog, { foreignKey: 'workoutPlanId'})
        db.WorkoutPlan.hasMany(db.User, { foreignKey: 'workoutPlanId' });
    };

    return WorkoutPlan;
}