'use strict';

// The seed merged primary + secondary muscles into one list, so the muscle filter matched
// any involvement. Add an is_primary flag on the join and backfill it from the source
// dataset's primaryMuscles so we can filter/sort by the primary mover.
const primaryMap = require('../seeders/data/exercise-primary-muscles.json');

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('exercisetargetmuscles', 'is_primary', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });

        const [exRows] = await queryInterface.sequelize.query('SELECT id, name FROM exercises');
        const [muscleRows] = await queryInterface.sequelize.query('SELECT id, name FROM targetmuscles');
        const exId = Object.fromEntries(exRows.map((r) => [r.name, r.id]));
        const muscleId = Object.fromEntries(muscleRows.map((r) => [r.name, r.id]));

        const pairs = [];
        for (const [name, muscles] of Object.entries(primaryMap)) {
            const eid = exId[name];
            if (!eid) continue;
            for (const m of muscles) {
                const mid = muscleId[m];
                if (mid) pairs.push([eid, mid]);
            }
        }

        const chunkSize = 500;
        for (let i = 0; i < pairs.length; i += chunkSize) {
            const slice = pairs.slice(i, i + chunkSize);
            const tuples = slice.map(() => '(?,?)').join(',');
            await queryInterface.sequelize.query(
                `UPDATE exercisetargetmuscles SET is_primary = true WHERE (exercise_id, targetMuscle_id) IN (${tuples})`,
                { replacements: slice.flat() }
            );
        }
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('exercisetargetmuscles', 'is_primary');
    },
};
