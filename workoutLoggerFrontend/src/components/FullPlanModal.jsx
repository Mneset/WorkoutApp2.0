import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Card from './Card';
import Button from './Button';

export default function FullPlanModal({ plan, activePlanId, onClose, onPlanChange }) {
  const { getToken, user } = useAuth();
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toDateInput = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const [startDate, setStartDate] = useState(() => toDateInput(new Date()));

  const sessionsByDay = {};
  if (plan.SessionTemplates) {
    plan.SessionTemplates.forEach((session) => {
      sessionsByDay[session.dayOffset] = session;
    });
  }

  const startWorkoutPlan = async () => {
    if (!startDate) {
      setError('Please choose a start date');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const accessToken = await getToken();

      await api.put(
        `/users/${user.sub}`,
        { workoutPlanId: plan.id, startDate },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      onPlanChange?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.data?.message || 'Failed to start plan';
      setError(msg);
      console.error('Error starting plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const quitWorkoutPlan = async () => {
    if (!window.confirm('Quit your active plan?')) return;
    setLoading(true);
    setError(null);
    try {
      const accessToken = await getToken();
      await api.delete('/users/plan', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      onPlanChange?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.data?.message || 'Failed to quit plan';
      setError(msg);
      console.error('Error quitting plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const isActive = activePlanId != null && plan.id === activePlanId;
  const hasActivePlan = activePlanId != null;

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

        {isActive ? (
          <div className="mt-6 rounded-xl border border-clay-tintborder bg-clay-tint px-4 py-3 text-sm text-clay-ink">
            This is your active plan.
          </div>
        ) : hasActivePlan ? (
          <div className="mt-6 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
            You already have an active plan. Quit it first to start this one.
          </div>
        ) : (
          <div className="mt-6">
            <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
              Start date
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-2 w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm focus:border-clay focus:outline-none focus:ring-[3px] focus:ring-clay-tint"
            />
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-line bg-clay-tint px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {isActive ? (
          <button
            onClick={quitWorkoutPlan}
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-danger px-5 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-55"
          >
            {loading ? 'Ending…' : 'Quit plan'}
          </button>
        ) : (
          <Button
            className="mt-4 w-full"
            onClick={startWorkoutPlan}
            disabled={loading || hasActivePlan}
          >
            {loading ? 'Starting…' : 'Start This Plan'}
          </Button>
        )}
      </Card>
    </div>
  );
}