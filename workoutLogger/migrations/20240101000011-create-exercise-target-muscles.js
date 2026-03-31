'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('exercisetargetmuscles', {
            exercise_id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                references: {
                    model: 'exercises',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            targetMuscle_id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                references: {
                    model: 'targetmuscles',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('exercisetargetmuscles');
    },
};
