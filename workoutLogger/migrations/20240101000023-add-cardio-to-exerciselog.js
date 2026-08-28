'use strict';

// Cardio logs record duration + distance instead of reps × weight, so add those columns
// and relax reps/weight to nullable (a cardio log has neither).
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('exerciselog', 'duration_seconds', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
        await queryInterface.addColumn('exerciselog', 'distance', {
            type: Sequelize.FLOAT,
            allowNull: true,
        });
        await queryInterface.changeColumn('exerciselog', 'reps', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
        await queryInterface.changeColumn('exerciselog', 'weight', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('exerciselog', 'duration_seconds');
        await queryInterface.removeColumn('exerciselog', 'distance');
        await queryInterface.changeColumn('exerciselog', 'reps', {
            type: Sequelize.INTEGER,
            allowNull: false,
        });
        await queryInterface.changeColumn('exerciselog', 'weight', {
            type: Sequelize.INTEGER,
            allowNull: false,
        });
    },
};
