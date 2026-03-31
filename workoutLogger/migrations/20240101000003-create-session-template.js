'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('sessiontemplate', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
            },
            days_offset: {
                type: Sequelize.INTEGER,
                unique: true,
            },
            workout_plan_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'workoutplan',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('sessiontemplate');
    },
};
