'use strict';

// Per-exercise display order within a session (all sets of an exercise share the value).
// Nullable so pre-existing logs fall back to creation order.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('exerciselog', 'order_index', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('exerciselog', 'order_index');
    },
};
