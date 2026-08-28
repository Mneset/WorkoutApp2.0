'use strict';

// Plan exercises can now prescribe per-set values (set 1: 10×50, set 2: 8×55, …) instead
// of one "base" value repeated across baseSets. Store that ordered list as JSON; the base_*
// columns stay as a fallback for legacy templates created before this column existed.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('exercisetemplate', 'sets', {
            type: Sequelize.JSON,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('exercisetemplate', 'sets');
    },
};
