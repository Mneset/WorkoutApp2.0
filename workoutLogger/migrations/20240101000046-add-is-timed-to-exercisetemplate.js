'use strict';

/**
 * Lets a plan/template prescribe a time-based hold (stretch, plank, isometric): the exercise
 * logs a duration per set instead of reps × weight. Pairs with `weight_unit` (kg / pct) to
 * give a three-way choice — kg, % of 1RM, or time. Defaults to false.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('exercisetemplate', 'is_timed', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('exercisetemplate', 'is_timed');
    },
};
