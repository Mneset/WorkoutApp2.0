'use strict';

// A user's starred/favorite exercises, surfaced at the top of the exercise picker.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('user_favorite_exercises', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            user_id: { type: Sequelize.STRING, allowNull: false },
            exercise_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'exercises', key: 'id' },
                onDelete: 'CASCADE',
            },
        });
        await queryInterface.addConstraint('user_favorite_exercises', {
            fields: ['user_id', 'exercise_id'],
            type: 'unique',
            name: 'user_favorite_exercises_unique',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('user_favorite_exercises');
    },
};
