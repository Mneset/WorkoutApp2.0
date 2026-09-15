'use strict';

/**
 * Lets a lifter tick off each set as it's done while logging. Defaults to false so existing
 * logs and freshly-created sets start unchecked.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('exerciselog', 'completed', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('exerciselog', 'completed');
    },
};
