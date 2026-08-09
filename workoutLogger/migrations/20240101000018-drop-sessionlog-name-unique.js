'use strict';

// Same bug class as migration 016: sessionlog.name had a spurious global UNIQUE index
// (the model declares unique: false). Two sessions sharing a name would crash the insert.
module.exports = {
    async up(queryInterface) {
        try {
            await queryInterface.sequelize.query(
                'ALTER TABLE `sessionlog` DROP INDEX `name`'
            );
        } catch (err) {
            // Index may not exist (e.g. a freshly built DB) — safe to ignore.
        }
    },

    async down(queryInterface, Sequelize) {
        // Intentionally minimal — restoring the buggy global uniqueness is not desirable.
    },
};
