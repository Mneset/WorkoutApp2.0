'use strict';

// Per-exercise weight unit for a plan/template: 'kg' (absolute) or 'pct' (percentage of
// the user's 1RM, resolved to kg when a session is started).
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('exercisetemplate', 'weight_unit', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'kg',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('exercisetemplate', 'weight_unit');
    },
};
