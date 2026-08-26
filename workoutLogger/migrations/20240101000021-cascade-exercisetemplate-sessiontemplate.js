'use strict';

// exercisetemplate.session_template_id was created without ON DELETE CASCADE, so
// deleting a session template (or a plan, which cascades to its session templates)
// fails while exercise templates still reference it. The model already declares the
// cascade; this brings the DB constraint in line so plan deletion works cleanly.
module.exports = {
    async up(queryInterface) {
        const table = 'exercisetemplate';
        const column = 'session_template_id';

        // The FK's auto-generated name can vary, so look it up rather than assume it.
        const [rows] = await queryInterface.sequelize.query(
            `SELECT CONSTRAINT_NAME AS name
             FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = '${table}'
               AND COLUMN_NAME = '${column}'
               AND REFERENCED_TABLE_NAME = 'sessiontemplate'`
        );

        for (const row of rows) {
            await queryInterface.sequelize.query(
                `ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${row.name}\``
            );
        }

        await queryInterface.sequelize.query(
            `ALTER TABLE \`${table}\`
             ADD CONSTRAINT \`exercisetemplate_session_template_fk\`
             FOREIGN KEY (\`${column}\`) REFERENCES \`sessiontemplate\` (\`id\`)
             ON DELETE CASCADE ON UPDATE CASCADE`
        );
    },

    async down(queryInterface) {
        const table = 'exercisetemplate';
        await queryInterface.sequelize.query(
            `ALTER TABLE \`${table}\` DROP FOREIGN KEY \`exercisetemplate_session_template_fk\``
        );
        await queryInterface.sequelize.query(
            `ALTER TABLE \`${table}\`
             ADD CONSTRAINT \`exercisetemplate_ibfk_1\`
             FOREIGN KEY (\`session_template_id\`) REFERENCES \`sessiontemplate\` (\`id\`)`
        );
    },
};
