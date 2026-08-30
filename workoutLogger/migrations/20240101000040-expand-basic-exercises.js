'use strict';

// Re-apply the (expanded) curated basic list — adds the glute/leg staples to is_basic on
// databases that already ran migration 039. Idempotent: names already flagged stay flagged.
const BASIC = require('../seeders/data/basic-exercises.json');

module.exports = {
    async up(queryInterface) {
        const chunkSize = 200;
        for (let i = 0; i < BASIC.length; i += chunkSize) {
            const slice = BASIC.slice(i, i + chunkSize);
            const placeholders = slice.map(() => '?').join(',');
            await queryInterface.sequelize.query(
                `UPDATE exercises SET is_basic = true WHERE name IN (${placeholders})`,
                { replacements: slice }
            );
        }
    },

    // No-op: we can't tell which flags predate this migration, and is_basic is fully
    // re-derived by 039 + this migration, so there's nothing safe to revert here.
    async down() {},
};
