'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('users', {
            id: {
                type: Sequelize.STRING(255),
                primaryKey: true,
            },
            username: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
            },
            email: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
            },
            role_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'role',
                    key: 'id',
                },
            },
            workout_plan_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'workoutplan',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            plan_start_date: {
                type: Sequelize.INTEGER,
            },
            current_week: {
                type: Sequelize.INTEGER,
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('users');
    },
};
