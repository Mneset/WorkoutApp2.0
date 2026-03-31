'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('exerciselog', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            exercise_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'exercises',
                    key: 'id',
                },
            },
            sets_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'sets',
                    key: 'id',
                },
            },
            reps: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            weight: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            notes: {
                type: Sequelize.TEXT,
            },
            session_log_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'sessionlog',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('exerciselog');
    },
};
