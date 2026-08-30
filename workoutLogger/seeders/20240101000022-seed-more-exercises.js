'use strict';

// Expands the exercise library from a bundled dataset derived from the public-domain
// free-exercise-db (yuhonas/free-exercise-db), mapped to our taxonomy. Idempotent: every
// insert is INSERT IGNORE and all ids are resolved BY NAME at runtime, so it runs safely
// on top of the already-seeded reference data.
//
// Data file: ./data/exercise-library.json — { muscles[], equipment[], categories[],
// exercises: [{ name, type, muscles[], equipment[], categories[] }] }.
//
// Join-table column keys are the literal (mixed-case) schema names:
//   exercisetargetmuscles: exercise_id, targetMuscle_id
//   exercisecategories:    exercise_id, category_id
//   exerciseequipment:     exercise_id, equipment_id

const { QueryTypes } = require('sequelize');
const LIB = require('./data/exercise-library.json');
// exercise name -> [primary target-muscle names] (for the is_primary flag on the join).
const PRIMARY = require('./data/exercise-primary-muscles.json');
// exercise name -> { instructions[], images[] } for the detail view.
const DETAILS = require('./data/exercise-details.json');
// Curated "basic" staples (names); cardio is also treated as basic.
const BASIC = new Set(require('./data/basic-exercises.json'));

const chunk = (arr, size) => {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
};

async function nameToId(queryInterface, table) {
    const rows = await queryInterface.sequelize.query(`SELECT id, name FROM ${table}`, {
        type: QueryTypes.SELECT,
    });
    return Object.fromEntries(rows.map((r) => [r.name, r.id]));
}

async function insertAll(queryInterface, table, rows) {
    for (const c of chunk(rows, 500)) {
        if (c.length) await queryInterface.bulkInsert(table, c, { ignoreDuplicates: true });
    }
}

module.exports = {
    async up(queryInterface) {
        // 1. Ensure all referenced muscles / equipment / categories exist.
        await insertAll(queryInterface, 'targetmuscles', LIB.muscles.map((name) => ({ name })));
        await insertAll(queryInterface, 'equipment', LIB.equipment.map((name) => ({ name })));
        await insertAll(queryInterface, 'categories', LIB.categories.map((name) => ({ name })));

        // 2. Insert exercises (with type + detail). Existing names are ignored.
        await insertAll(
            queryInterface,
            'exercises',
            LIB.exercises.map((e) => {
                const d = DETAILS[e.name] || {};
                return {
                    name: e.name,
                    type: e.type,
                    instructions: JSON.stringify(d.instructions || []),
                    images: JSON.stringify(d.images || []),
                    is_basic: BASIC.has(e.name) || e.type === 'cardio',
                };
            })
        );

        // 3. Resolve ids by name.
        const exIds = await nameToId(queryInterface, 'exercises');
        const muscleIds = await nameToId(queryInterface, 'targetmuscles');
        const catIds = await nameToId(queryInterface, 'categories');
        const equipIds = await nameToId(queryInterface, 'equipment');

        // 4. Build and insert association rows.
        const tm = [];
        const ec = [];
        const ee = [];
        for (const e of LIB.exercises) {
            const eid = exIds[e.name];
            if (!eid) continue;
            const primary = new Set(PRIMARY[e.name] || []);
            (e.muscles || []).forEach(
                (m) =>
                    muscleIds[m] &&
                    tm.push({ exercise_id: eid, targetMuscle_id: muscleIds[m], is_primary: primary.has(m) })
            );
            (e.categories || []).forEach((c) => catIds[c] && ec.push({ exercise_id: eid, category_id: catIds[c] }));
            (e.equipment || []).forEach((q) => equipIds[q] && ee.push({ exercise_id: eid, equipment_id: equipIds[q] }));
        }
        await insertAll(queryInterface, 'exercisetargetmuscles', tm);
        await insertAll(queryInterface, 'exercisecategories', ec);
        await insertAll(queryInterface, 'exerciseequipment', ee);
    },

    async down(queryInterface) {
        const names = LIB.exercises.map((e) => e.name);
        const rows = await queryInterface.sequelize.query(
            'SELECT id FROM exercises WHERE name IN (:names)',
            { replacements: { names }, type: QueryTypes.SELECT }
        );
        const ids = rows.map((r) => r.id);
        if (ids.length) {
            await queryInterface.bulkDelete('exercisetargetmuscles', { exercise_id: ids });
            await queryInterface.bulkDelete('exercisecategories', { exercise_id: ids });
            await queryInterface.bulkDelete('exerciseequipment', { exercise_id: ids });
            await queryInterface.bulkDelete('exercises', { id: ids });
        }
        // Leave the added muscles/equipment/categories in place — harmless.
    },
};
