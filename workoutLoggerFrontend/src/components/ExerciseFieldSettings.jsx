import React from 'react';

// Gear glyph for the per-exercise field settings button.
export const gearGlyph = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </svg>
);

/**
 * Is a field on for this exercise? Everything defaults to on, so only an explicit `false`
 * turns something off and a config saved before a key existed keeps working.
 *
 * `showNotes` was the single notes flag before set and exercise notes were split apart; it
 * still answers for both so configs written then behave as they did.
 */
export function fieldOn(config, key) {
  const cfg = config || {};
  if (cfg[key] !== undefined) return cfg[key] !== false;
  if (key === 'showSetNotes' || key === 'showExerciseNotes') return cfg.showNotes !== false;
  return true;
}

/**
 * The gear button that opens the per-exercise field settings.
 * `open`/`onToggle` are owned by the caller so it can keep one panel open at a time.
 */
export function FieldSettingsButton({ open, onToggle }) {
  return (
    <button
      type="button"
      aria-label="Exercise field settings"
      aria-expanded={open}
      title="Which fields this exercise shows when logged"
      onClick={onToggle}
      className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg border border-line-strong transition-colors hover:bg-clay-tint hover:text-clay ${
        open ? 'bg-clay-tint text-clay' : 'text-ink'
      }`}
    >
      {gearGlyph}
    </button>
  );
}

/**
 * Which optional fields an exercise shows when it is logged, set per exercise in the
 * plan/template builders.
 *
 * Rendered inline, as a block in the exercise card rather than an anchored popover: the
 * cards clip their overflow, and a 240px panel hanging off a button has nowhere to go on a
 * phone. Inline costs a little vertical space and cannot be clipped or pushed off-screen.
 *
 * - `config`: the resolved { showRpe, showRir, showNotes } for this exercise
 * - `onChange(patch)`: merge a patch into it
 * - `hideRir`: cardio and time-based exercises have no reps, so no reps in reserve
 */
export default function ExerciseFieldSettings({ config, onChange, hideRir = false }) {
  const rows = [
    { key: 'showRpe', label: 'RPE', hint: 'Rate of perceived exertion' },
    ...(hideRir ? [] : [{ key: 'showRir', label: 'RIR', hint: 'Reps in reserve' }]),
    { key: 'showSetNotes', label: 'Set notes', hint: 'A note per set, e.g. a cue for set 3' },
    { key: 'showExerciseNotes', label: 'Exercise note', hint: 'One note for the whole exercise' },
  ];
  return (
    <div className="mb-3 rounded-xl border border-line bg-surface-2 p-2.5">
      <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
        Fields on this exercise
      </p>
      {rows.map(({ key, label, hint }) => {
        const on = fieldOn(config, key);
        return (
          <button
            key={key}
            type="button"
            role="switch"
            aria-checked={on}
            onClick={() => onChange({ [key]: !on })}
            className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-2 text-left hover:bg-clay-tint/40"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">{label}</span>
              <span className="block text-xs text-muted">{hint}</span>
            </span>
            <span
              className={`grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border-2 ${
                on ? 'border-clay bg-clay text-white' : 'border-line-strong text-transparent'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
            </span>
          </button>
        );
      })}
      <p className="mt-1 border-t border-line px-1 pt-2 text-[11px] leading-snug text-muted">
        These switch the fields on here, in the builder. Anything you write always shows while
        logging, as a read-only message. Whether you can add your <em>own</em> note while
        logging is a separate setting, in your profile.
      </p>
    </div>
  );
}
