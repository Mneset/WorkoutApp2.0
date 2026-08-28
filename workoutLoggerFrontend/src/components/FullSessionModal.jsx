import React, { useEffect } from 'react';
import Card from './Card';
import { formatDuration, pace } from '../duration';

export default function FullSessionModal({ session, onClose }) {
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const logs = Array.isArray(session?.ExerciseLogs) ? session.ExerciseLogs : [];
  const grouped = logs.reduce((acc, log) => {
    const exerciseName = log?.Exercise?.name || 'Exercise';
    if (!acc[exerciseName]) acc[exerciseName] = [];
    acc[exerciseName].push(log);
    return acc;
  }, {});
  const totalKg = logs.reduce(
    (sum, log) => sum + (Number(log.weight) || 0) * (Number(log.reps) || 0),
    0
  );

  return (
    <div
      className="fixed inset-0 z-100 grid place-items-center bg-[rgba(28,26,23,0.45)] p-6"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg">{session?.name || 'Untitled session'}</h3>
            <p className="mt-0.5 text-sm text-muted">
              {session?.sessionDateStart
                ? new Date(session.sessionDateStart).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''}
            </p>
          </div>
          <button
            className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-danger"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Summary chips */}
        {logs.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {totalKg > 0 && (
              <span className="rounded-full bg-clay-tint px-3 py-1 text-xs font-semibold text-clay">
                {totalKg.toLocaleString()} kg volume
              </span>
            )}
            <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted">
              {Object.keys(grouped).length} exercises
            </span>
            <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted">
              {logs.length} sets
            </span>
          </div>
        )}

        {/* Session notes — meta box */}
        {session?.notes ? (
          <div className="mb-5 rounded-xl border border-clay-tintborder bg-surface-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-clay-tint text-clay">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 6h14M5 12h14M5 18h9" />
                </svg>
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">Session notes</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink [overflow-wrap:anywhere]">{session.notes}</p>
          </div>
        ) : null}

        {/* Exercises */}
        {logs.length > 0 ? (
          <div className="flex flex-col gap-4">
            {Object.entries(grouped).map(([exerciseName, exerciseLogs]) => {
              const isCardio = exerciseLogs[0]?.Exercise?.type === 'cardio';
              return (
              <div key={exerciseName} className="overflow-hidden rounded-xl border border-line">
                <div className="flex items-center justify-between gap-2 border-b border-line bg-surface-2 px-4 py-2.5">
                  <div className="min-w-0 truncate text-sm font-semibold">{exerciseName}</div>
                  {isCardio && (
                    <span className="flex-shrink-0 rounded-full bg-clay-tint px-2 py-0.5 text-[10px] font-semibold text-clay">
                      Cardio
                    </span>
                  )}
                </div>
                <div>
                  {exerciseLogs.map((log, index) => (
                    <div
                      key={`${session.id}-${log.exerciseId}-${index}`}
                      className="flex items-center gap-3 border-t border-line px-3 py-2.5 text-sm first:border-t-0"
                    >
                      <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-clay-tint text-xs font-bold text-clay">
                        {index + 1}
                      </span>
                      <div className="min-w-0 text-ink">
                        {isCardio ? (
                          <span>
                            {formatDuration(log.durationSeconds) || '–'}
                            {log.distance != null ? ` · ${log.distance} km` : ''}
                            {pace(log.durationSeconds, log.distance) ? ` · ${pace(log.durationSeconds, log.distance)}` : ''}
                            {log.rpe != null && log.rpe !== '' ? ` · RPE ${log.rpe}` : ''}
                          </span>
                        ) : (
                          <span>
                            {log.reps} reps × {log.weight} kg
                            {log.rpe != null && log.rpe !== '' ? ` · RPE ${log.rpe}` : ''}
                            {log.rir != null && log.rir !== '' ? ` · ${log.rir} RIR` : ''}
                          </span>
                        )}
                        {log.notes ? (
                          <div className="mt-0.5 whitespace-pre-wrap text-xs text-muted [overflow-wrap:anywhere]">{log.notes}</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-muted">
            No exercise logs found for this session.
          </div>
        )}
      </Card>
    </div>
  );
}
