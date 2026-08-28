'use strict';

// Discriminator for how an exercise is logged: 'strength' (reps × weight) or 'cardio'
// (duration + distance). Existing rows default to 'strength'.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('exercises', 'type', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'strength',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('exercises', 'type');
    },
};
