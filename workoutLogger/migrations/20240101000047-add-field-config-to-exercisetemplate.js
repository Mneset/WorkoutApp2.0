'use strict';

/**
 * Which optional fields (RPE / RIR / Notes) a plan exercise shows while it is logged.
 * This used to be a single profile-wide preference, which meant one setting had to suit
 * every exercise in every plan. It now belongs to the exercise that was authored.
 *
 * Shape: { showRpe: bool, showRir: bool, showNotes: bool }. Null on legacy rows, and on
 * those the user's profile defaults apply, so nothing changes for templates saved before
 * this column existed.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('exercisetemplate', 'field_config', {
            type: Sequelize.JSON,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('exercisetemplate', 'field_config');
    },
};
