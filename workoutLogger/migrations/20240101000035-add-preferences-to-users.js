'use strict';

// Per-user preferences (JSON), e.g. which optional fields show while logging.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'preferences', {
            type: Sequelize.JSON,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('users', 'preferences');
    },
};
