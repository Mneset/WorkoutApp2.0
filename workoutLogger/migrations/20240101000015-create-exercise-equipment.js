'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('exerciseequipment', {
            exercise_id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                references: {
                    model: 'exercises',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
            equipment_id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                references: {
                    model: 'equipment',
                    key: 'id',
                },
                onDelete: 'CASCADE',
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('exerciseequipment');
    },
};
