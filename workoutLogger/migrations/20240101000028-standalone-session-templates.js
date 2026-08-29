'use strict';

// Standalone session templates: a reusable session you can start anytime, not tied to a
// plan. Reuses the sessiontemplate table — a standalone template has a null workout_plan_id
// and an owning user_id; plan templates keep their workout_plan_id and a null user_id.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn('sessiontemplate', 'workout_plan_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
        await queryInterface.addColumn('sessiontemplate', 'user_id', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('sessiontemplate', 'user_id');
        await queryInterface.changeColumn('sessiontemplate', 'workout_plan_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
        });
    },
};
