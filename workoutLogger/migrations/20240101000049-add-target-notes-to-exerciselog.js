'use strict';

/**
 * The plan's notes, kept apart from the lifter's own. `notes` used to hold both: starting a
 * session copied the prescribed note into it, so the first thing you typed destroyed the cue
 * and the session no longer recorded what had been prescribed.
 *
 * This mirrors the split the other prescribed values already use (target_reps vs reps,
 * target_weight vs weight): target_* is what the plan said, the plain column is what you did.
 *
 * - target_notes: the note authored on this specific set.
 * - target_exercise_notes: the note authored on the exercise as a whole. Denormalised onto
 *   every set row the same way is_timed and field_config are, so logging never has to read
 *   back a template the user may since have edited.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('exerciselog', 'target_notes', {
            type: Sequelize.TEXT,
            allowNull: true,
        });
        await queryInterface.addColumn('exerciselog', 'target_exercise_notes', {
            type: Sequelize.TEXT,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('exerciselog', 'target_notes');
        await queryInterface.removeColumn('exerciselog', 'target_exercise_notes');
    },
};
