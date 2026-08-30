'use strict';

// Step-by-step instructions + image paths per exercise, from the public-domain
// free-exercise-db. Images are referenced by path and loaded from the jsDelivr CDN, so we
// store only the paths (not the ~1700 files). Both are lazy-loaded, not part of the list.
const details = require('../seeders/data/exercise-details.json');

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('exercises', 'instructions', { type: Sequelize.JSON, allowNull: true });
        await queryInterface.addColumn('exercises', 'images', { type: Sequelize.JSON, allowNull: true });

        const [rows] = await queryInterface.sequelize.query('SELECT id, name FROM exercises');
        for (const r of rows) {
            const d = details[r.name];
            if (!d) continue;
            await queryInterface.sequelize.query(
                'UPDATE exercises SET instructions = ?, images = ? WHERE id = ?',
                { replacements: [JSON.stringify(d.instructions || []), JSON.stringify(d.images || []), r.id] }
            );
        }
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('exercises', 'instructions');
        await queryInterface.removeColumn('exercises', 'images');
    },
};
