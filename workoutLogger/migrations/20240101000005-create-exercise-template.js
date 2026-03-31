'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('exercisetemplate', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            session_template_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'sessiontemplate',
                    key: 'id',
                },
            },
            exercise_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'exercises',
                    key: 'id',
                },
            },
            order_index: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            base_sets: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            base_reps: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            base_weight: {
                type: Sequelize.FLOAT,
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('exercisetemplate');
    },
};
