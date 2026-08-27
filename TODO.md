# Workout App — To-Do

A running list of things to fix / add. Newest ideas can be appended at the bottom.

## 1. Delete a set while logging a workout — ✅ DONE (built, needs testing)
**Problem:** In the live session builder you can `+ Add set`, but there's no way to
remove a set. If you add one by mistake, you're stuck with it.

**What to do:**
- Add a per-set delete control (e.g. a small ✕ on each set row) in the New Session
  set table.
- On delete, remove that exercise log via `DELETE /exercise-log/:id` and drop the row
  from `editTableLogs`.
- Decide behavior when deleting the last set of an exercise (remove the exercise card
  entirely?). Note: there's already a stubbed `deleteExercise` (TODO: implement) in
  `NewSessionPage.jsx` — a per-exercise delete could be finished at the same time.

**Files:** `workoutLoggerFrontend/src/components/NewSessionPage.jsx`, backend
`exercise-log` route (delete already exists).

## 2 + 3. Editable session builder — ✅ DONE (built, needs testing)
These are the same feature: **one editable builder, loaded by session id**, used to
edit a finished session OR continue an unfinished one. "Finish" just sets/updates
`sessionDateEnd`.

**Key fact about the current data model:**
- A `SessionLog` is created the moment you **start** a session (`sessionDateStart` set,
  `sessionDateEnd` null). Clicking Finish only sets `sessionDateEnd` (+ final notes/name).
- So an unfinished session already exists in the DB and already shows in history —
  `HistoryPage` lists every session with no filter (see `HistoryPage.jsx`).
- **`sessionDateEnd == null` is the single source of truth for "in progress".**

**What to do:**
- Make the session builder (`NewSessionPage.jsx`) able to open ANY session by id, not
  just a freshly started one — for both editing a completed session and resuming an
  in-progress one. Same view the workout is created in.
- Editing covers reps / weight / RPE / RIR / notes / session name, plus add/remove
  sets and exercises (see item 1). Backend already supports it (`PUT /session/:id`,
  `PUT /exercise-log/:id`, `DELETE /exercise-log/:id`).
- **History shows only FINISHED sessions** (`sessionDateEnd != null`). No "in progress"
  badge or section anywhere — unfinished sessions simply don't appear in history.
  Add the filter in `HistoryPage.jsx` (and check the dashboard "Recent sessions" list
  too, so an unfinished one doesn't show there either).
- **Only ONE in-progress session at a time** (one session with `sessionDateEnd` null).
  Never silently create a second one. Decided UX:
    - **Dashboard = state-aware (primary pattern).** When a session is in progress,
      don't show "Start a session". Instead show a small "You have a workout in
      progress" line with two buttons: **Resume workout** (primary) and
      **Discard & start new** (secondary, styled destructive).
    - **Other Start entry points = guarded modal (fallback).** Places you can't turn
      into persistent state (e.g. a plan's "Start session" card) check for an
      in-progress session on tap and, if one exists, show a prompt:
      *"You have a session in progress — Resume it, or Discard it and start new?"*
    - Resume → open that session in the builder.
    - Discard → delete the in-progress session (`DELETE /session/:id`), then start
      fresh. **Discard always confirms first** ("This deletes your in-progress
      workout — continue?") since it permanently drops a session.
- **Resume must come from the backend.** The active session currently lives only in
  `SessionContext` (in memory), so closing the app/browser loses it. On load, query for
  the user's unfinished session (`sessionDateEnd` null) and offer to resume.
- Replace read-only `FullSessionModal` view with (or route to) the editable builder.

**Knock-on (DONE):** the dashboard "today's workout complete" check now requires the
session to have an end date (`sessionDateEnd`), so an abandoned start no longer marks
the day done (`planSchedule` in `DashboardPage.jsx`).

**Files:** `NewSessionPage.jsx` (make it load/edit by id), `FullSessionModal.jsx`,
`HistoryPage.jsx`, `SessionContext`, `DashboardPage.jsx`, backend session service/route.
