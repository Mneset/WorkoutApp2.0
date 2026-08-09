'use strict';

// create-users.js created plan_start_date as INTEGER, but the User model (and the
// app) treat it as a DATE. Correct the column type so starting a plan can store a date.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn('users', 'plan_start_date', {
            type: Sequelize.DATE,
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn('users', 'plan_start_date', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
    },
};