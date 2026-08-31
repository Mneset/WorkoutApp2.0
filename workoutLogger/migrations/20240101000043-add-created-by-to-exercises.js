'use strict';

/**
 * Ownership for user-created exercises. `created_by` NULL = a library ("premade") exercise
 * visible to everyone; a set value ties the exercise to the user who made it, so it only
 * shows for them. FK to users.id (varchar) with ON DELETE CASCADE so a user's custom
 * exercises are cleaned up with the account.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('exercises', 'created_by', {
            type: Sequelize.STRING(255),
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('exercises', 'created_by');
    },
};
