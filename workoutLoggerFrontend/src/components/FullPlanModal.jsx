import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Card from './Card';
import Button from './Button';

export default function FullPlanModal({ plan, onClose }) {
  const { getToken, user } = useAuth();
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sessionsByDay = {};
  if (plan.SessionTemplates) {
    plan.SessionTemplates.forEach((session) => {
      sessionsByDay[session.dayOffset] = session;
    });
  }

  const startWorkoutPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = await getToken();
      const today = new Date().toISOString().split('T')[0];

      await api.put(
        `/users/${user.sub}`,
        { workoutPlanId: plan.id, startDate: today },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      onClose();
    } catch (err) {
      const msg = err.response?.data?.data?.message || 'Failed to start plan';
      setError(msg);
      console.error('Error starting plan:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-100 grid place-items-center bg-[rgba(28,26,23,0.45)] p-6"
    >
      <Card
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl">{plan.name}</h3>
            <div className="mt-1 font-mono text-xs text-muted">{plan.durationWeeks} weeks</div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            ✕
          </button>
        </div>

        {plan.description && <p className="mt-3 text-sm text-muted">{plan.description}</p>}

        <div className="mt-6">
          <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
            Weekly Schedule
          </span>
          <div className="mt-3 flex flex-col gap-2">
            {daysOfWeek.map((day, index) => {
              const session = sessionsByDay[index];
              return (
                <div key={day} className="rounded-xl border border-line bg-surface-2 px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold text-ink">{day}</span>
                    {session ? (
                      <span className="text-sm text-ink">{session.name}</span>
                    ) : (
                      <span className="text-xs text-muted">Rest Day</span>
                    )}
                  </div>
                  {session && session.ExerciseTemplates && session.ExerciseTemplates.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-muted">
                      {session.ExerciseTemplates.map((ex) => (
                        <li key={ex.id}>{ex.Exercise?.name || 'Unknown Exercise'}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-line bg-clay-tint px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <Button className="mt-4 w-full" onClick={startWorkoutPlan} disabled={loading}>
          {loading ? 'Starting…' : 'Start This Plan'}
        </Button>
      </Card>
    </div>
  );
}