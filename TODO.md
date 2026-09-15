# Workout App — To-Do

Plan: `~/.claude/plans/velvet-purring-quill.md` (Expand exercise library + Cardio type).

## Gym feedback (in-use) — captured during live workouts, not yet triaged

- [x] **Session & exercise notes sometimes disappear** when going in and out of a workout —
  the **session note** was only saved on Finish (no on-blur save), so leaving mid-session
  lost it. Added `PATCH /session/:id` (`updateSessionInfo`, updates notes/name without
  ending the session) and a save-on-blur for the session note + name. Per-set/exercise
  notes already committed on blur. **Needs backend restart** (new route).
- [x] **Bottom-nav "+" changes when a workout is active** — `SessionContext` now hydrates
  from the server on load (finds a session with no end date), so "active session" state
  survives a reload app-wide. The raised center button keeps its clay color but swaps to a
  ▶ play icon with a "Resume" label while a session is in progress. Still routes to
  `/new-session`, which resumes it. Frontend-only.
- [x] **Dashboard planned-session card shows "Resume", not "Start", once it's in progress**
  — when the in-progress session was started from today's planned template
  (`inProgress.sessionTemplateId === next.id`), the card reads "In progress" and offers a
  "Resume session" button (→ resumeInProgress) instead of "Start session". Frontend-only.
- [ ] **Time-based logging toggle** — some exercises (stretches, planks, isometric holds)
  should log **duration instead of kg×reps**. Add a per-exercise strength/time toggle (like
  the kg/% toggle) so those log a hold time. (Cardio already logs duration/distance — this
  is a "timed strength/hold" variant, likely reusing the duration input without distance/pace.)
- [x] **Weight input must allow up to 2 decimals** (not integer-only). Root cause: the live
  weight input was `type="number"`, which rejects the comma decimal key that comma-locale
  (e.g. Norwegian) phone keyboards send — so only whole numbers could be typed. Switched it
  to a sanitized `type="text"` `inputMode="decimal"` input that accepts `,` or `.`, allows up
  to two decimals, and stores the canonical `.` form (matches the reps-input pattern).
- [x] **"Add to Home Screen" prompt reworked** — the big win: click-away / ✕ / "Maybe later"
  now only **snooze** (3 days, then it returns), so an accidental dismiss no longer hides it
  forever; a separate "Don't show this again" is the only permanent opt-out. Copy sharpened
  (clear "why" + "takes 5 seconds"), numbered 1-2-3 steps with the platform icons inline
  (iOS Safari Share → Add to Home Screen; Android Chrome ⋮ → Install). Frontend-only.
- [ ] **Variable-size supersets** — support grouping exercises into supersets of any length,
  labeled A1–A2, B1–B2–B3, etc. Needs grouping in the builder/session, the A/B group +
  position labels, carried through plans/templates → live session → history. (Check how far
  the existing `/sets` set-type model already goes.)
- [x] **Per-set notes are now on-demand** — a small pen/paper button per set (desktop: in the
  Notes column; mobile: an "Add note" pen on its own line) reveals the note input on tap and
  autofocuses it; a set whose note already has text shows the box straight away. Frontend-only
  (`SessionBuilderView`, `openNoteIds` state).
- [ ] **Per-week / per-session periodization in the plan builder** — currently a plan defines
  one week that repeats for the whole program. Add an option to lay out **every week
  individually**, with the builder **paginated per week**, so each session can differ
  week-to-week (e.g. powerlifter varying 1RM-% targets across weeks/sessions). Likely a
  data-model change (weeks × sessions); keep "repeat one week" as the default mode.
- [ ] **Show "last time" for each exercise while logging** — when performing an exercise,
  display what was done last time (previous session's sets: reps × weight, RPE/RIR) as a
  reference to progress off. Needs a "most recent prior log for this exercise+user" lookup
  and a compact per-set display in the session builder.
- [x] **"Complete" / check-off sets in the session log** — the set-number badge is now a
  toggle while logging: tap it to mark the set done (fills clay with a ✓) and it persists.
  Backed by a `completed` boolean on `exerciselog` (migration `044`), threaded through the
  update route/schema and saved immediately on tap (also on other commits), so it survives
  leaving/resuming. **Needs migration `044` + backend restart.**

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
- **Customizable dashboard cards** — let the user choose which cards/data show on the home
  screen (e.g. toggles for each dashboard section: recent sessions, stats, active plan,
  streak, etc.), so the dashboard can be tailored to what they care about. Store the choices
  in `users.preferences` (like the logging-column toggles) and gate each `DashboardPage`
  section on them; add the toggles to the Profile page.
- [x] **Add custom exercise** — a "Create new exercise" affordance in `ExercisePickerModal`
  (name + primary/secondary target muscles + equipment + numbered instruction steps; type
  inherited from the picker) that POSTs to `/exercise-log/exercise`. Muscle chips cycle
  off → primary → secondary (stored via `exercisetargetmuscles.is_primary`); equipment links
  the `exerciseequipment` join; instructions save to the same `exercises.instructions` JSON
  column and render as numbered steps in the detail view exactly like library exercises. The
  form loads a `GET /exercise-log/taxonomy` (all muscles + equipment). Custom exercises are **owned by the user** (`created_by` FK on
  `exercises`, migration `043`, NULL = library): `getAllExercises(userId)` returns library +
  the user's own only, so one person's exercise never shows for another. Shown in both Basic
  and All (created with `is_basic` true), tagged with a **"Mine"** badge, and deletable
  (`DELETE /exercise-log/exercise/:id`, owner-checked). Creating one selects & adds it right
  away. Needs migration `043` + a **backend restart** (new routes/service).
- **User-owned plans & templates + public/private visibility** — tie every plan and
  standalone template to its creating user (a `user_id`/`created_by` owner column, backfill
  existing ones). Default library plans/templates stay owner-less ("premade"). Add a
  **public/private** flag chosen when creating/editing a plan or template. Lists then show:
  premade + the user's own always; other users' entries only if they're **public** *and* the
  viewer has a Profile toggle **"Show community plans/templates"** turned on. Mirrors the
  exercise ownership + Basic/All model below.
- [x] **Filter/sort by primary movers** — `is_primary` flag on the `exercisetargetmuscles`
  join (migration `037`), backfilled from the free-exercise-db `primaryMuscles` split
  (bundled `data/exercise-primary-muscles.json`; seeder also sets it for fresh installs).
  `getAllExercises` exposes it via the through attributes; the picker's muscle filter now
  matches the **primary** mover, and each row lists primaries first (secondaries dimmed).
  Frontend degrades gracefully if the flag isn't present yet.
