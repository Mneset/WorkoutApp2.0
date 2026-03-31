'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('equipment', {
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
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('equipment');
    },
};
