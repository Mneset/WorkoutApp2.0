import React from 'react';
import Card from './Card';
import Button from './Button';
import { formatDuration, pace } from '../duration';

// One prescribed set → a compact human-readable line.
function describeSet(set, isCardio) {
  if (isCardio) {
    const parts = [];
    if (set.durationSeconds) parts.push(formatDuration(set.durationSeconds));
    if (set.distance) parts.push(`${set.distance} km`);
    const p = pace(set.durationSeconds, set.distance);
    if (p) parts.push(`${p}/km`);
    if (set.rpe != null && set.rpe !== '') parts.push(`RPE ${set.rpe}`);
    return parts.join(' · ') || '—';
  }
  const reps = set.reps ?? '–';
  const weight = set.weight ?? 0;
  let line = `${reps} × ${weight} kg`;
  const extra = [];
  if (set.rpe != null && set.rpe !== '') extra.push(`RPE ${set.rpe}`);
  if (set.rir != null && set.rir !== '') extra.push(`RIR ${set.rir}`);
  if (extra.length) line += ` · ${extra.join(' · ')}`;
  return line;
}

// The prescribed sets for an exercise template: prefer the per-set list, fall back to
// baseSets × the base values for legacy templates.
function setsFor(ex) {
  if (Array.isArray(ex.sets) && ex.sets.length > 0) return ex.sets;
  const isCardio = ex.Exercise?.type === 'cardio';
  return Array.from({ length: ex.baseSets || 1 }, () =>
    isCardio
      ? { durationSeconds: ex.baseDurationSeconds, distance: ex.baseDistance, rpe: ex.baseRpe }
      : { reps: ex.baseReps, weight: ex.baseWeight, rpe: ex.baseRpe, rir: ex.baseRir }
  );
}

export default function FullTemplateModal({ template, onClose, onStart, onDelete, starting }) {
  const exercises = [...(template.ExerciseTemplates || [])].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-100 grid place-items-center bg-[rgba(28,26,23,0.45)] p-6"
    >
      <Card
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-lg flex-col p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-xl">{template.name}</h3>
            <div className="mt-1 font-mono text-xs text-muted">
              {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            ✕
          </button>
        </div>

        {template.notes && <p className="mt-3 text-sm italic text-muted">{template.notes}</p>}

        <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
          {exercises.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">This template has no exercises.</p>
          ) : (
            exercises.map((ex) => {
              const isCardio = ex.Exercise?.type === 'cardio';
              const sets = setsFor(ex);
              return (
                <div key={ex.id} className="rounded-xl border border-line bg-surface-2 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {ex.Exercise?.name || 'Exercise'}
                    </span>
                    {isCardio && (
                      <span className="rounded-full bg-clay-tint px-2 py-0.5 text-[10px] font-semibold text-clay">
                        Cardio
                      </span>
                    )}
                  </div>
                  {ex.notes && <p className="mt-1 text-xs italic text-muted">{ex.notes}</p>}
                  <ul className="mt-2 space-y-0.5">
                    {sets.map((set, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted">
                        <span className="font-mono text-xs text-clay">{i + 1}</span>
                        <span>{describeSet(set, isCardio)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 pt-1">
          <Button variant="danger" onClick={() => onDelete(template.id)}>
            Delete
          </Button>
          <Button onClick={() => onStart(template.id)} disabled={starting}>
            {starting ? 'Starting…' : 'Start workout'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
