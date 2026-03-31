'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('exercisecategories', {
            exercise_id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                references: {
                    model: 'exercises',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            category_id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                references: {
                    model: 'categories',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('exercisecategories');
    },
};
