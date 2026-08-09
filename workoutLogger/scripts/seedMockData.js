/**
 * Mock data seeder (dev only).
 *
 *   node scripts/seedMockData.js
 *
 * Seeds, for one user:
 *   - 6 workout plans (one is an active 8-week plan)
 *   - ~24 standalone sessions: 6/week for 4 weeks, no plan
 *   - 4 sessions logged inside the active plan
 *
 * Re-runnable: it first deletes this user's sessions and ALL workout plans,
 * then reseeds. Requires the reference data (`npm run seed`) to exist first.
 *
 * Target user: set your own Auth0 sub via MOCK_USER_ID (e.g. in workoutLogger/.env,
 * which is gitignored) or pass it as the first CLI arg. Defaults to a placeholder,
 * so seeding for your real account requires supplying the id.
 *
 *   MOCK_USER_ID='github|123' npm run seed:mock
 *   node scripts/seedMockData.js 'github|123'
 */

require('dotenv').config();
const db = require('../models');

const USER_ID = process.env.MOCK_USER_ID || process.argv[2] || 'mock|user';

// ---------- helpers ----------
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function daysAgo(n, hour = 17, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// ---------- exercise pools (names must exist in the seeded `exercises`) ----------
const POOL = {
  push: [
    { ex: 'Bench Press', sets: 4, reps: 8, weight: 80 },
    { ex: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 28 },
    { ex: 'Chest Fly', sets: 3, reps: 14, weight: 16 },
    { ex: 'Cable Crossover', sets: 3, reps: 15, weight: 20 },
  ],
  pull: [
    { ex: 'Deadlift', sets: 3, reps: 5, weight: 120 },
    { ex: 'Pull-Up', sets: 4, reps: 8, weight: 0 },
    { ex: 'Bent-Over Row', sets: 4, reps: 8, weight: 70 },
    { ex: 'Lat Pulldown', sets: 3, reps: 12, weight: 55 },
    { ex: 'Seated Cable Row', sets: 3, reps: 12, weight: 60 },
  ],
  legs: [
    { ex: 'Squat', sets: 4, reps: 6, weight: 110 },
    { ex: 'Leg Press', sets: 3, reps: 12, weight: 180 },
    { ex: 'Leg Curl', sets: 3, reps: 12, weight: 45 },
    { ex: 'Calf Raise', sets: 4, reps: 15, weight: 60 },
    { ex: 'Lunges', sets: 3, reps: 10, weight: 20 },
  ],
};

// ---------- 6 plans (first is the active 8-week one) ----------
const PLANS = [
  {
    name: 'PowerBuilding 8-Week',
    description: 'Heavy compounds up top, hypertrophy accessories. 4 days/week.',
    durationWeeks: 8,
    active: true,
    sessions: [
      { name: 'Upper A', day: 0, exercises: [POOL.push[0], POOL.pull[2], POOL.push[1]] },
      { name: 'Lower A', day: 1, exercises: [POOL.legs[0], POOL.legs[2], POOL.legs[3]] },
      { name: 'Upper B', day: 3, exercises: [POOL.pull[1], POOL.push[2], POOL.pull[3]] },
      { name: 'Lower B', day: 4, exercises: [POOL.legs[1], POOL.legs[4], POOL.legs[2]] },
    ],
  },
  {
    name: 'Push / Pull / Legs',
    description: 'Classic 6-day PPL for volume and frequency.',
    durationWeeks: 6,
    sessions: [
      { name: 'Push', day: 0, exercises: POOL.push },
      { name: 'Pull', day: 1, exercises: POOL.pull },
      { name: 'Legs', day: 2, exercises: POOL.legs },
      { name: 'Push', day: 3, exercises: POOL.push },
      { name: 'Pull', day: 4, exercises: POOL.pull },
      { name: 'Legs', day: 5, exercises: POOL.legs },
    ],
  },
  {
    name: 'Upper / Lower',
    description: 'Balanced 4-day upper/lower split.',
    durationWeeks: 6,
    sessions: [
      { name: 'Upper', day: 0, exercises: [POOL.push[0], POOL.pull[2], POOL.push[1], POOL.pull[3]] },
      { name: 'Lower', day: 1, exercises: [POOL.legs[0], POOL.legs[1], POOL.legs[2]] },
      { name: 'Upper', day: 3, exercises: [POOL.pull[1], POOL.push[0], POOL.pull[4], POOL.push[2]] },
      { name: 'Lower', day: 4, exercises: [POOL.legs[0], POOL.legs[3], POOL.legs[4]] },
    ],
  },
  {
    name: 'Full Body 3x',
    description: 'Three full-body days a week — great for busy weeks.',
    durationWeeks: 4,
    sessions: [
      { name: 'Full Body A', day: 0, exercises: [POOL.legs[0], POOL.push[0], POOL.pull[2]] },
      { name: 'Full Body B', day: 2, exercises: [POOL.pull[0], POOL.push[1], POOL.legs[2]] },
      { name: 'Full Body C', day: 4, exercises: [POOL.legs[1], POOL.pull[3], POOL.push[3]] },
    ],
  },
  {
    name: 'Bro Split',
    description: 'One muscle group a day, 5 days a week.',
    durationWeeks: 5,
    sessions: [
      { name: 'Chest', day: 0, exercises: [POOL.push[0], POOL.push[1], POOL.push[2], POOL.push[3]] },
      { name: 'Back', day: 1, exercises: [POOL.pull[0], POOL.pull[2], POOL.pull[3], POOL.pull[4]] },
      { name: 'Legs', day: 2, exercises: POOL.legs },
      { name: 'Shoulders', day: 3, exercises: [POOL.push[3], POOL.pull[2], POOL.push[2]] },
      { name: 'Arms', day: 4, exercises: [POOL.pull[3], POOL.push[1]] },
    ],
  },
  {
    name: 'Beginner Strength',
    description: 'Simple 3-day linear progression for newer lifters.',
    durationWeeks: 12,
    sessions: [
      { name: 'Workout A', day: 0, exercises: [POOL.legs[0], POOL.push[0], POOL.pull[2]] },
      { name: 'Workout B', day: 2, exercises: [POOL.legs[0], POOL.push[3], POOL.pull[0]] },
      { name: 'Workout A', day: 4, exercises: [POOL.legs[0], POOL.push[0], POOL.pull[2]] },
    ],
  },
];

async function main() {
  await db.sequelize.authenticate();

  // Ensure the target user exists (create if missing).
  const existingUser = await db.User.findByPk(USER_ID);
  if (!existingUser) {
    const role = await db.Role.findOne();
    if (!role) {
      console.error('No roles found. Run `npm run seed` (reference data) first.');
      process.exit(1);
    }
    await db.User.create({
      id: USER_ID,
      username: 'mockuser',
      email: 'mock@example.com',
      roleId: role.id,
      currentWeek: 1,
    });
    console.log('Created user', USER_ID);
  }

  // Build exercise name -> id map.
  const exercises = await db.Exercise.findAll();
  if (exercises.length === 0) {
    console.error('No exercises found. Run `npm run seed` (reference data) first.');
    process.exit(1);
  }
  const exId = {};
  exercises.forEach((e) => { exId[e.name] = e.id; });
  const findEx = (name) => exId[name];

  const firstSet = await db.Set.findOne();
  const SET_ID = firstSet ? firstSet.id : 1;

  // ---- wipe previous mock data (re-runnable) ----
  await db.SessionLog.destroy({ where: { userId: USER_ID } }); // cascades exercise logs
  // Delete templates child-first (the DB FKs here don't cascade), then the plans.
  await db.ExerciseTemplate.destroy({ where: {} });
  await db.SessionTemplate.destroy({ where: {} });
  await db.WorkoutPlan.destroy({ where: {} });
  await db.User.update(
    { workoutPlanId: null, planStartDate: null, currentWeek: 1 },
    { where: { id: USER_ID } }
  );

  // ---- create a session log with its sets ----
  async function logSession({ name, start, durationMin, exercises: exs, workoutPlanId = null, sessionTemplateId = null, weekNumber = null }) {
    const end = new Date(start.getTime() + durationMin * 60000);
    const session = await db.SessionLog.create({
      userId: USER_ID,
      name,
      sessionDateStart: start,
      sessionDateEnd: end,
      workoutPlanId,
      sessionTemplateId,
      weekNumber,
    });
    const rows = [];
    for (const e of exs) {
      const exerciseId = findEx(e.ex);
      if (!exerciseId) continue;
      for (let i = 0; i < e.sets; i++) {
        rows.push({
          exerciseId,
          setId: SET_ID,
          reps: Math.max(1, (e.reps || 8) + rand(-1, 1)),
          weight: e.weight || 0,
          rpe: e.rpe != null ? e.rpe : rand(7, 9),
          rir: e.rir != null ? e.rir : rand(0, 3),
          sessionLogId: session.id,
        });
      }
    }
    if (rows.length) await db.ExerciseLog.bulkCreate(rows);
    return session;
  }

  // ---- create the 6 plans ----
  const created = [];
  for (const def of PLANS) {
    const plan = await db.WorkoutPlan.create({
      name: def.name,
      description: def.description,
      durationWeeks: def.durationWeeks,
    });
    const sessionTemplates = [];
    for (const s of def.sessions) {
      const st = await db.SessionTemplate.create({
        name: s.name,
        dayOffset: s.day,
        workout_plan_id: plan.id,
      });
      let order = 0;
      for (const e of s.exercises) {
        const exerciseId = findEx(e.ex);
        if (!exerciseId) continue;
        await db.ExerciseTemplate.create({
          sessionTemplateId: st.id,
          exerciseId,
          orderIndex: order++,
          baseSets: e.sets,
          baseReps: e.reps,
          baseWeight: e.weight,
          baseRpe: 8,
          baseRir: 2,
        });
      }
      sessionTemplates.push({ ...s, id: st.id });
    }
    created.push({ def, plan, sessionTemplates });
  }

  // ---- 24 standalone sessions: 6/week for 4 weeks, no plan ----
  const dayMap = [0, 1, 2, 4, 5, 6]; // Mon,Tue,Wed,Fri,Sat,Sun
  const ppl = [POOL.push, POOL.pull, POOL.legs];
  const pplNames = ['Push', 'Pull', 'Legs'];
  let noPlan = 0;
  for (let week = 0; week < 4; week++) {
    const mondayDaysAgo = 42 - week * 7;
    for (let i = 0; i < 6; i++) {
      const start = daysAgo(mondayDaysAgo - dayMap[i], 17, rand(0, 30));
      // small week-over-week progression on load
      const exs = ppl[i % 3].map((e) => ({ ...e, weight: e.weight ? e.weight + week * 2 : 0 }));
      await logSession({ name: pplNames[i % 3], start, durationMin: rand(48, 72), exercises: exs });
      noPlan++;
    }
  }

  // ---- active plan: 4 logged sessions + set it active ----
  const active = created.find((c) => c.def.active);
  const planSessionPlan = [
    { idx: 0, days: 12, week: 1 },
    { idx: 1, days: 10, week: 1 },
    { idx: 2, days: 5, week: 2 },
    { idx: 3, days: 2, week: 2 },
  ];
  for (const p of planSessionPlan) {
    const st = active.sessionTemplates[p.idx];
    await logSession({
      name: `${st.name} - Week ${p.week}`,
      start: daysAgo(p.days, 18, rand(0, 30)),
      durationMin: rand(50, 75),
      exercises: st.exercises,
      workoutPlanId: active.plan.id,
      sessionTemplateId: st.id,
      weekNumber: p.week,
    });
  }

  await db.User.update(
    { workoutPlanId: active.plan.id, planStartDate: daysAgo(14, 0, 0), currentWeek: 2 },
    { where: { id: USER_ID } }
  );

  console.log(`Seeded for ${USER_ID}:`);
  console.log(`  - ${created.length} plans (active: ${active.def.name})`);
  console.log(`  - ${noPlan} standalone sessions (6/week x 4 weeks)`);
  console.log(`  - ${planSessionPlan.length} sessions in the active plan`);

  await db.sequelize.close();
}

main().catch((err) => {
  console.error('Mock seed failed:', err);
  process.exit(1);
});
