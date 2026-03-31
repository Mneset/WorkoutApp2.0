'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('sessionlog', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            user_id: {
                type: Sequelize.STRING(255),
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            name: {
                type: Sequelize.STRING(255),
                unique: true,
            },
            notes: {
                type: Sequelize.TEXT,
            },
            session_date_start: {
                type: Sequelize.DATE,
            },
            session_date_end: {
                type: Sequelize.DATE,
            },
            workout_plan_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'workoutplan',
                    key: 'id',
                },
            },
            session_template_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'sessiontemplate',
                    key: 'id',
                },
            },
            week_number: {
                type: Sequelize.INTEGER,
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('sessionlog');
    },
};
