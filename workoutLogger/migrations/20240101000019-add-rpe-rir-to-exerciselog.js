'use strict';

// Add RPE (rate of perceived exertion, 0-10, allows halves) and RIR (reps in reserve,
// integer) to each logged set. Both optional.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('exerciselog', 'rpe', {
            type: Sequelize.FLOAT,
            allowNull: true,
        });
        await queryInterface.addColumn('exerciselog', 'rir', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('exerciselog', 'rpe');
        await queryInterface.removeColumn('exerciselog', 'rir');
    },
};
