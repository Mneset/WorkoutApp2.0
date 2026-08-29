'use strict';

// Weight was stored as INTEGER, so decimal loads (e.g. 12.5 kg) were rounded on save.
// Widen it to FLOAT to support fractional plates.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn('exerciselog', 'weight', {
            type: Sequelize.FLOAT,
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn('exerciselog', 'weight', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
    },
};
