import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Button from './Button';
import ExercisePickerModal from './ExercisePickerModal';

const inputClass =
  'rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm focus:border-clay focus:outline-none focus:ring-[3px] focus:ring-clay-tint';

// Epley estimate: 1RM ≈ w × (1 + reps/30).
const epley = (weight, reps) => {
  const w = Number(weight);
  const r = Number(reps);
  if (!w || !r) return null;
  return Math.round(w * (1 + r / 30) * 10) / 10;
};

export default function OneRepMaxPage() {
  const { getToken, user } = useAuth();
  const navigate = useNavigate();

  const [exercises, setExercises] = useState([]);
  const [rows, setRows] = useState([]); // { exerciseId, name, value, calcOpen, calcWeight, calcReps }
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  const authHeaders = async () => ({ Authorization: `Bearer ${await getToken()}` });

  useEffect(() => {
    const load = async () => {
      try {
        const headers = await authHeaders();
        const [exRes, ormRes] = await Promise.all([
          api.get('/exercise-log', { headers }),
          api.get('/one-rep-max', { params: { userId: user.sub }, headers }),
        ]);
        setExercises(exRes.data.data.result || []);
        setRows(
          (ormRes.data.data.result || []).map((r) => ({
            exerciseId: r.exerciseId,
            name: r.Exercise?.name || 'Exercise',
            value: String(r.oneRm),
            saved: true,
          }))
        );
      } catch (err) {
        console.error('Error loading 1RMs:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patchRow = (exerciseId, patch) =>
    setRows((prev) => prev.map((r) => (r.exerciseId === exerciseId ? { ...r, ...patch } : r)));

  const save = async (exerciseId, value) => {
    const oneRm = Number(value);
    if (!(oneRm > 0)) return;
    try {
      const headers = await authHeaders();
      await api.put('/one-rep-max', { userId: user.sub, exerciseId, oneRm }, { headers });
      patchRow(exerciseId, { saved: true });
    } catch (err) {
      console.error('Error saving 1RM:', err);
      alert('Failed to save 1RM. Please try again.');
    }
  };

  const remove = async (exerciseId) => {
    try {
      const headers = await authHeaders();
      await api.delete(`/one-rep-max/${exerciseId}`, { params: { userId: user.sub }, headers });
      setRows((prev) => prev.filter((r) => r.exerciseId !== exerciseId));
    } catch (err) {
      console.error('Error deleting 1RM:', err);
    }
  };

  const fromHistory = async (exerciseId) => {
    try {
      const headers = await authHeaders();
      const res = await api.get('/one-rep-max/estimate', {
        params: { userId: user.sub, exerciseId },
        headers,
      });
      const est = res.data.data.result?.estimate;
      if (est == null) {
        alert('No logged history for this exercise yet — enter it manually or use Calculate.');
        return;
      }
      patchRow(exerciseId, { value: String(est), saved: false });
    } catch (err) {
      console.error('Error estimating from history:', err);
      alert('Could not estimate from history. Please try again.');
    }
  };

  const applyCalc = (row) => {
    const est = epley(row.calcWeight, row.calcReps);
    if (est == null) return;
    // Fill the value; the user confirms with Save.
    patchRow(row.exerciseId, { value: String(est), calcOpen: false, calcWeight: '', calcReps: '', saved: false });
  };

  const addExercise = (exercise) => {
    if (rows.some((r) => r.exerciseId === exercise.id)) return; // already listed
    setRows((prev) => [{ exerciseId: exercise.id, name: exercise.name, value: '' }, ...prev]);
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <span
        onClick={() => navigate('/workout-plan')}
        className="cursor-pointer text-[13px] font-semibold text-clay hover:text-clay-hover"
      >
        ← Back to plans
      </span>

      <div className="mt-3 mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl">1-Rep Maxes</h1>
          <p className="mt-1 text-sm text-muted">
            Used to turn percentage-based plan weights (e.g. 75%) into real targets.
          </p>
        </div>
        <Button onClick={() => setPickerOpen(true)}>Add exercise</Button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-muted">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong py-12 text-center text-sm text-muted">
          No 1-rep maxes yet. Add an exercise to set one.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.exerciseId} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{row.name}</div>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  inputMode="decimal"
                  placeholder="kg"
                  className={`${inputClass} w-24 text-center`}
                  value={row.value}
                  onChange={(e) => patchRow(row.exerciseId, { value: e.target.value, saved: false })}
                />
                <span className="text-sm text-muted">kg</span>
                <button
                  type="button"
                  onClick={() => save(row.exerciseId, row.value)}
                  disabled={!(Number(row.value) > 0)}
                  className="rounded-lg bg-clay px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-clay-hover disabled:opacity-40"
                >
                  {row.saved ? 'Saved ✓' : 'Save'}
                </button>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  className="rounded-lg border border-line-strong px-2.5 py-1.5 font-semibold text-clay transition-colors hover:border-clay hover:bg-clay-tint"
                  onClick={() =>
                    patchRow(row.exerciseId, { calcOpen: !row.calcOpen, calcWeight: '', calcReps: '' })
                  }
                >
                  {row.calcOpen ? 'Close calculator' : 'Calculate'}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-line-strong px-2.5 py-1.5 font-semibold text-clay transition-colors hover:border-clay hover:bg-clay-tint"
                  onClick={() => fromHistory(row.exerciseId)}
                >
                  Estimate from history
                </button>
                <button
                  type="button"
                  className="ml-auto rounded-lg border border-line-strong px-2.5 py-1.5 font-semibold text-muted transition-colors hover:border-danger hover:bg-danger/10 hover:text-danger"
                  onClick={() => remove(row.exerciseId)}
                >
                  Remove
                </button>
              </div>

              {row.calcOpen && (
                <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-surface-2 p-3">
                  <label className="text-xs text-muted">
                    <span className="mb-1 block font-semibold uppercase tracking-wide">Weight</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      inputMode="decimal"
                      placeholder="kg"
                      className={`${inputClass} w-24 text-center`}
                      value={row.calcWeight || ''}
                      onChange={(e) => patchRow(row.exerciseId, { calcWeight: e.target.value })}
                    />
                  </label>
                  <span className="pb-2.5 text-muted">×</span>
                  <label className="text-xs text-muted">
                    <span className="mb-1 block font-semibold uppercase tracking-wide">Reps</span>
                    <input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      placeholder="reps"
                      className={`${inputClass} w-24 text-center`}
                      value={row.calcReps || ''}
                      onChange={(e) => patchRow(row.exerciseId, { calcReps: e.target.value })}
                    />
                  </label>
                  <Button variant="outline" className="ml-auto" onClick={() => applyCalc(row)}>
                    Apply {epley(row.calcWeight, row.calcReps) ? `(${epley(row.calcWeight, row.calcReps)} kg)` : ''}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pickerOpen && (
        <ExercisePickerModal
          type="strength"
          exercises={exercises}
          onClose={() => setPickerOpen(false)}
          onSelect={(ex) => addExercise(ex)}
        />
      )}
    </div>
  );
}
