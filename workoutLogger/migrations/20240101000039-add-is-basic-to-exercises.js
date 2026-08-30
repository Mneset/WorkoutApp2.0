'use strict';

// A curated "basic" subset of the ~873-exercise library (common gym staples), so users can
// hide the very specific variations. All cardio counts as basic too (that list is small).
const BASIC = require('../seeders/data/basic-exercises.json');

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('exercises', 'is_basic', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });

        // Mark the curated staples.
        const chunkSize = 200;
        for (let i = 0; i < BASIC.length; i += chunkSize) {
            const slice = BASIC.slice(i, i + chunkSize);
            const placeholders = slice.map(() => '?').join(',');
            await queryInterface.sequelize.query(
                `UPDATE exercises SET is_basic = true WHERE name IN (${placeholders})`,
                { replacements: slice }
            );
        }
        // And all cardio.
        await queryInterface.sequelize.query("UPDATE exercises SET is_basic = true WHERE type = 'cardio'");
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('exercises', 'is_basic');
    },
};
