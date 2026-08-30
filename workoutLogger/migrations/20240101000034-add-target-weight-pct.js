'use strict';

// The percentage behind a %-of-1RM prescribed weight, kept separately from the resolved
// kg (target_weight) so the UI can show kg as the main hint and the % as a subtle caption.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('exerciselog', 'target_weight_pct', {
            type: Sequelize.FLOAT,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('exerciselog', 'target_weight_pct');
    },
};
