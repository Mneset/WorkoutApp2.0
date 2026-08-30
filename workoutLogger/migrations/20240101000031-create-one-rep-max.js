'use strict';

// Per-user, per-exercise 1-rep max (kg). Used to resolve percentage-based prescribed
// weights (e.g. "75%") into an absolute target when a session is started.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('user_exercise_1rm', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            user_id: { type: Sequelize.STRING, allowNull: false },
            exercise_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'exercises', key: 'id' },
                onDelete: 'CASCADE',
            },
            one_rm: { type: Sequelize.FLOAT, allowNull: false },
        });
        await queryInterface.addConstraint('user_exercise_1rm', {
            fields: ['user_id', 'exercise_id'],
            type: 'unique',
            name: 'user_exercise_1rm_user_exercise_unique',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('user_exercise_1rm');
    },
};
