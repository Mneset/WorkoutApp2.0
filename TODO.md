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

## Backlog / ideas

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
- **Alphabetical letter headers in the picker** — sort the exercise list A→Z and insert a
  sticky letter header before each group (A, B, C …) so the now-large list feels organised
  (`ExercisePickerModal.jsx`: sort `filteredExercises` by name, group by first letter,
  render a header per group). Favorites section sits above the A–Z list.
- **Filter/sort by primary movers** — the seed merged primary + secondary muscles into one
  `TargetMuscles` list, so the muscle filter currently matches any exercise where the muscle
  appears at all (even as a secondary mover). To filter/sort by the *primary* mover, preserve
  the distinction: add an `is_primary` flag to the `exercisetargetmuscles` join, re-seed from
  the dataset's `primaryMuscles`/`secondaryMuscles`, include it in `getAllExercises`, and have
  the picker filter/sort on primary. (Backend join migration + seeder + `ExercisePickerModal.jsx`.)
