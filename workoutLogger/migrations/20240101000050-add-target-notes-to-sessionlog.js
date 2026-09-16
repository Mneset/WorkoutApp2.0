'use strict';

/**
 * The session note the plan/template prescribed, kept apart from the one the lifter writes.
 * Starting a session used to copy the template's note into `notes`, which made it the user's
 * own note the moment they edited it. Same split as target_notes on exerciselog.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('sessionlog', 'target_notes', {
            type: Sequelize.TEXT,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('sessionlog', 'target_notes');
    },
};
