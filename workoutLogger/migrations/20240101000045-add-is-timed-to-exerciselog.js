'use strict';

/**
 * Marks a strength set as time-based (a hold — stretch, plank, isometric) so it logs a
 * duration in `duration_seconds` instead of reps × weight. Defaults to false.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('exerciselog', 'is_timed', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('exerciselog', 'is_timed');
    },
};
