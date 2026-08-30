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
- **Exercise descriptions + images** — free-exercise-db includes step-by-step `instructions`
  (text) and `images` (~2 photos/exercise: start/end position). Add an `instructions` TEXT
  column + store image paths, re-seed from the dataset (raw file still available), and show
  them in an exercise detail view / expandable picker row. Load images from jsDelivr CDN
  (`https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/<path>`) rather than
  bundling ~1700 files.
- **Favorite exercises** — let the user star exercises and show a **Favorites** section at
  the top of the exercise picker (`ExercisePickerModal.jsx`). Needs persistence: cleanest
  is a backend join table `user_favorite_exercises (user_id, exercise_id)` + a
  model/migration/service/route + a star toggle in the picker. (localStorage is a simpler
  per-device fallback but won't sync across devices.)
- [x] **Alphabetical letter headers in the picker** — `ExercisePickerModal` sorts A→Z and
  groups by first letter (non-letters under "#") with a sticky letter header per group;
  the header/search are now fixed and only the list scrolls. (A future Favorites section
  would sit above the A–Z list.)
- **Filter/sort by primary movers** — the seed merged primary + secondary muscles into one
  `TargetMuscles` list, so the muscle filter currently matches any exercise where the muscle
  appears at all (even as a secondary mover). To filter/sort by the *primary* mover, preserve
  the distinction: add an `is_primary` flag to the `exercisetargetmuscles` join, re-seed from
  the dataset's `primaryMuscles`/`secondaryMuscles`, include it in `getAllExercises`, and have
  the picker filter/sort on primary. (Backend join migration + seeder + `ExercisePickerModal.jsx`.)
