'use strict';

// target_weight now holds a display string so a percentage prescription can be shown as a
// placeholder (e.g. "75% · 52.5") rather than only a resolved number.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn('exerciselog', 'target_weight', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn('exerciselog', 'target_weight', {
            type: Sequelize.FLOAT,
            allowNull: true,
        });
    },
};
