import React, { useEffect } from 'react';
import Card from './Card';

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

  return (
    <div
      className="fixed inset-0 z-100 grid place-items-center bg-[rgba(28,26,23,0.45)] p-6"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between gap-4">
          <h3 className="text-lg">{session?.name || 'Untitled session'}</h3>
          <button
            className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-danger"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="mb-4 text-sm text-muted">
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

        {session?.notes ? (
          <div className="mb-5 rounded-xl border border-line bg-surface-2 px-4 py-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">Session notes</span>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink [overflow-wrap:anywhere]">{session.notes}</p>
          </div>
        ) : null}

        {logs.length > 0 ? (
          <div className="flex flex-col gap-5">
            {Object.entries(grouped).map(([exerciseName, exerciseLogs]) => (
              <div key={exerciseName}>
                <div className="mb-2 text-sm font-semibold">{exerciseName}</div>
                <div className="overflow-hidden rounded-xl border border-line">
                  {exerciseLogs.map((log, index) => (
                    <div
                      key={`${session.id}-${log.exerciseId}-${index}`}
                      className="grid grid-cols-[48px_1fr] items-center gap-3 border-t border-line px-3 py-2.5 text-sm first:border-t-0"
                    >
                      <span className="font-mono text-xs text-muted">Set {index + 1}</span>
                      <div className="min-w-0 text-ink">
                        <span>{log.reps} reps × {log.weight} kg</span>
                        {log.notes ? (
                          <div className="mt-0.5 whitespace-pre-wrap text-xs text-muted [overflow-wrap:anywhere]">{log.notes}</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
