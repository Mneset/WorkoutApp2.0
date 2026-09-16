'use strict';

/**
 * The authored field config, copied onto each set when a session is started from a plan.
 * Denormalised the same way `is_timed` and the target_* columns already are, so logging a
 * session never has to reach back into the template (which the user may since have edited).
 *
 * It doubles as the marker for where a set came from:
 *   non-null -> authored by a plan/template. Its config wins and the metric mode is locked.
 *   null     -> added freeform mid-session. The profile's "while logging" prefs apply and
 *               the Weight/Time toggle stays available, since nothing else can set it.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('exerciselog', 'field_config', {
            type: Sequelize.JSON,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('exerciselog', 'field_config');
    },
};
