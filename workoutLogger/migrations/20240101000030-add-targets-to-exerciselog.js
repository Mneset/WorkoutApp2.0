'use strict';

// A session started from a plan/template carries the prescription as *targets* on each
// log — shown as grey placeholders while you log the actual reps/weight. target_reps is a
// string so it can hold a range ("8-12") as well as a single number.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('exerciselog', 'target_reps', { type: Sequelize.STRING, allowNull: true });
        await queryInterface.addColumn('exerciselog', 'target_weight', { type: Sequelize.FLOAT, allowNull: true });
        await queryInterface.addColumn('exerciselog', 'target_duration_seconds', { type: Sequelize.INTEGER, allowNull: true });
        await queryInterface.addColumn('exerciselog', 'target_distance', { type: Sequelize.FLOAT, allowNull: true });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('exerciselog', 'target_reps');
        await queryInterface.removeColumn('exerciselog', 'target_weight');
        await queryInterface.removeColumn('exerciselog', 'target_duration_seconds');
        await queryInterface.removeColumn('exerciselog', 'target_distance');
    },
};
