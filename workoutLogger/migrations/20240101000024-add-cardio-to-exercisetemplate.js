'use strict';

// Cardio plan entries prescribe duration + distance instead of reps × weight, so add
// those base columns and relax base_reps to nullable.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('exercisetemplate', 'base_duration_seconds', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
        await queryInterface.addColumn('exercisetemplate', 'base_distance', {
            type: Sequelize.FLOAT,
            allowNull: true,
        });
        await queryInterface.changeColumn('exercisetemplate', 'base_reps', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('exercisetemplate', 'base_duration_seconds');
        await queryInterface.removeColumn('exercisetemplate', 'base_distance');
        await queryInterface.changeColumn('exercisetemplate', 'base_reps', {
            type: Sequelize.INTEGER,
            allowNull: false,
        });
    },
};
