# Workout App — To-Do

Plan: `~/.claude/plans/velvet-purring-quill.md` (Expand exercise library + Cardio type).

## In progress / next

- [x] **Phase 1 — Expand exercise library** — 873 exercises from free-exercise-db, seeded &
      live on the Pi. (`type` migration, dataset seeder, `exercise-library.json`.)
- [x] **Phase 2 — Cardio type + logging in sessions** — cardio log columns
      (duration/distance) + relaxed reps/weight, conditional session UI (separate
      "+ Add cardio" button & picker, Time/Distance/Pace cells), history-modal display.
      Needs migration `023` run on deploy.
- [x] **Phase 3 — Cardio in plans** — template cardio base fields (duration/distance) +
      relaxed baseReps, CreatePlanPage branches its row inputs by exercise type, and
      startSession pre-creates cardio logs from cardio templates. Needs migration `024`.

## Recently added

- [x] **Standalone session templates** — reusable, non-plan sessions built with the *same*
      builder as a live session (extracted into shared `SessionBuilderView`, used by both
      `NewSessionPage` and `CreateTemplatePage`). Stored as a `SessionTemplate` with a null
      `workout_plan_id` + owning `user_id` (migration `028`). The Plans page has a
      Plans/Templates segmented filter; templates can be started (`Start workout` →
      `POST /session` with the template id) or deleted.
- [x] **Per-set plan/template prescriptions + notes** — `exercisetemplate.sets` JSON
      (migration `026`) and `notes` on session/exercise templates (migration `027`).

## Recently added (cont.)

- [x] **Prescriptions as placeholders + rep ranges** — plan/template values ride into a
      started session as *targets* on each log (migration `030`: `target_reps` (string, so
      it holds ranges like "8-12"), `target_weight`, `target_duration_seconds`,
      `target_distance`); the log inputs start empty and show the target as a grey
      placeholder (fixes the "type 1 → 110" append bug). RPE/RIR are still pre-filled.
      Reps became a free-text range field in the plan & template builders.
- [x] **Weight supports decimals** — `exerciselog.weight` INTEGER → FLOAT (migration `029`).

## Backlog / ideas

- [x] **Edit plans & templates** — a pencil edit icon on each plan/template card opens the
  builder (`CreatePlanPage` / `CreateTemplatePage`) in **edit mode**, pre-populated from the
  card's nested data (passed via nav state). Save **replaces**: PUT the top-level fields,
  delete the old children, re-create from the builder. Plan-day deletion is made safe by a
  FK change on `sessionlog.session_template_id` → **ON DELETE SET NULL** (migration `042`;
  a logged session keeps its data, just loses its day link). No new endpoints.

- [x] **Trim the exercise list (Basic vs All)** — curated `data/basic-exercises.json` (~80
  gym staples) + `is_basic` on `exercises` (migration `039`, cardio counts as basic). A
  profile toggle **"Basic exercises only"** (in `preferences`, default on) trims the picker's
  main A–Z list to staples; favorites are always shown; degrades gracefully pre-migration.

- [x] **Profile section** — `/profile` page: edit display name (email read-only), toggle
  which optional columns show while logging (RPE / RIR / Notes), and **Log out** (moved off
  the navbar; avatar + a bottom-bar Profile tab link here). Prefs stored in `users.preferences`
  JSON (migration `035`); the session builder reads them to hide columns via a computed grid.
- [x] **Weight as % of 1RM in plans/templates** — per-exercise **kg / % 1RM** toggle in the
  plan & template builders (weight input stays decimal; `weight_unit` on `exercisetemplate`,
  migration `032`). Manual per-exercise **1RMs** in a new `/one-rep-max` screen (table
  `user_exercise_1rm`, migration `031`) with a **Calculate** helper (weight×reps Epley) and
  **Estimate from history**. `startSession` resolves a `%` set to `round(1RM × pct/100)` to
  the nearest 2.5 kg (blank if no 1RM on file).

- [x] **Plan builder exercise selection** — replaced the plain ~873-option `<select>` with
  the shared `ExercisePickerModal`: each template day has split **"+ Add exercise" /
  "+ Add cardio"** buttons that open the searchable, type-scoped picker, and rows now show
  the chosen exercise name (read-only) with a Cardio badge.
- [x] **Exercise descriptions + images** — `instructions` + `images` JSON columns on
  `exercises` (migration `038`), backfilled from the free-exercise-db dataset (bundled
  `data/exercise-details.json`; seeder sets them too). Lazy-loaded via
  `GET /exercise-log/details/:id` (kept out of the list query); the picker rows expand to
  show the start/end photos (loaded from the jsDelivr CDN) + numbered instructions.
- [x] **Favorite exercises** — star toggle on every row in `ExercisePickerModal` + a
  **★ Favorites** section pinned above the A–Z list (favorites excluded from the letter
  groups to avoid duplication). Backed by `user_favorite_exercises` (migration `036`) with a
  service + GET/POST/DELETE routes; the picker fetches the user's favorites on open.
- [x] **Alphabetical letter headers in the picker** — `ExercisePickerModal` sorts A→Z and
  groups by first letter (non-letters under "#") with a sticky letter header per group;
  the header/search are now fixed and only the list scrolls. (A future Favorites section
  would sit above the A–Z list.)
- [x] **Start-workout: scratch vs template prompt** — New Session now resumes an
  in-progress session if there is one, otherwise shows a choice screen: **Start from
  scratch** (blank) or start from one of your **templates** (list of standalone templates).
  Side benefit: a blank session is only created on explicit "from scratch", so visiting New
  Session no longer auto-creates orphan blanks.
- **Add custom exercise** — let the user create their own exercise (name + type +
  optional target muscles/equipment) from the picker when what they want isn't in the
  library, and have it appear in the list. Needs a create-exercise route/service and a
  "+ Create new exercise" affordance in `ExercisePickerModal` (and to mark user-created
  ones, likely a `created_by`/`user_id` column on `exercises`).
- [x] **Filter/sort by primary movers** — `is_primary` flag on the `exercisetargetmuscles`
  join (migration `037`), backfilled from the free-exercise-db `primaryMuscles` split
  (bundled `data/exercise-primary-muscles.json`; seeder also sets it for fresh installs).
  `getAllExercises` exposes it via the through attributes; the picker's muscle filter now
  matches the **primary** mover, and each row lists primaries first (secondaries dimmed).
  Frontend degrades gracefully if the flag isn't present yet.
