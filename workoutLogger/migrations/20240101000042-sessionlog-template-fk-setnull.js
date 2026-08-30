'use strict';

// Editing a plan replaces its day templates (delete + recreate). A logged session may
// reference a day via session_template_id, so make that FK ON DELETE SET NULL — the
// session keeps all its logged data, it just loses the "which day it came from" link.
module.exports = {
    async up(queryInterface, Sequelize) {
        const [fks] = await queryInterface.sequelize.query(`
            SELECT CONSTRAINT_NAME AS name FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sessionlog'
              AND COLUMN_NAME = 'session_template_id' AND REFERENCED_TABLE_NAME IS NOT NULL
        `);
        for (const fk of fks) {
            await queryInterface.sequelize.query(`ALTER TABLE sessionlog DROP FOREIGN KEY \`${fk.name}\``);
        }
        await queryInterface.addConstraint('sessionlog', {
            fields: ['session_template_id'],
            type: 'foreign key',
            name: 'sessionlog_session_template_id_setnull',
            references: { table: 'sessiontemplate', field: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
        });
    },

    async down(queryInterface) {
        try {
            await queryInterface.sequelize.query(
                'ALTER TABLE sessionlog DROP FOREIGN KEY `sessionlog_session_template_id_setnull`'
            );
        } catch {
            // ignore if not present
        }
        await queryInterface.addConstraint('sessionlog', {
            fields: ['session_template_id'],
            type: 'foreign key',
            references: { table: 'sessiontemplate', field: 'id' },
        });
    },
};
