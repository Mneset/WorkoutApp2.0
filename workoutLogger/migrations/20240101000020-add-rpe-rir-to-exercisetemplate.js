'use strict';

// Target RPE / RIR on a plan's exercise templates, mirroring the per-set rpe/rir on logs.
// When a session is started from a template, these seed each generated set's rpe/rir.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('exercisetemplate', 'base_rpe', {
            type: Sequelize.FLOAT,
            allowNull: true,
        });
        await queryInterface.addColumn('exercisetemplate', 'base_rir', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('exercisetemplate', 'base_rpe');
        await queryInterface.removeColumn('exercisetemplate', 'base_rir');
    },
};
