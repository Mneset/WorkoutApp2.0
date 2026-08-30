import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Card from './Card';
import Button from './Button';

const inputClass =
  'rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm focus:border-clay focus:outline-none focus:ring-[3px] focus:ring-clay-tint';

const epley = (weight, reps) => {
  const w = Number(weight);
  const r = Number(reps);
  if (!w || !r) return null;
  return Math.round(w * (1 + r / 30) * 10) / 10;
};

/**
 * Blocks starting a plan/template that prescribes % of 1RM until the user has a 1RM for
 * every such exercise. `missing` is [{ exerciseId, name }]; on save it PUTs each 1RM and
 * calls onComplete() to continue the start it interrupted.
 */
export default function MissingOneRepMaxModal({ missing, title = 'Set your 1-rep maxes', onClose, onComplete }) {
  const { getToken, user } = useAuth();
  const [rows, setRows] = useState(() =>
    missing.map((m) => ({ ...m, value: '', calcOpen: false, calcWeight: '', calcReps: '' }))
  );
  const [saving, setSaving] = useState(false);

  const patch = (exerciseId, p) =>
    setRows((prev) => prev.map((r) => (r.exerciseId === exerciseId ? { ...r, ...p } : r)));

  const allFilled = rows.every((r) => Number(r.value) > 0);

  const applyCalc = (row) => {
    const est = epley(row.calcWeight, row.calcReps);
    if (est == null) return;
    patch(row.exerciseId, { value: String(est), calcOpen: false, calcWeight: '', calcReps: '' });
  };

  const saveAndContinue = async () => {
    if (!allFilled) return;
    setSaving(true);
    try {
      const headers = { Authorization: `Bearer ${await getToken()}` };
      for (const r of rows) {
        await api.put(
          '/one-rep-max',
          { userId: user.sub, exerciseId: r.exerciseId, oneRm: Number(r.value) },
          { headers }
        );
      }
      onComplete();
    } catch (err) {
      console.error('Error saving 1RMs:', err);
      alert('Failed to save. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[200] grid place-items-center bg-[rgba(28,26,23,0.45)] p-6">
      <Card onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-lg flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl">{title}</h3>
            <p className="mt-1 text-sm text-muted">
              This uses % of your 1-rep max, so set a 1RM for each exercise below to continue.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
          {rows.map((row) => (
            <div key={row.exerciseId} className="rounded-xl border border-line bg-surface-2 p-3.5">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{row.name}</div>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  inputMode="decimal"
                  placeholder="kg"
                  className={`${inputClass} w-24 text-center`}
                  value={row.value}
                  onChange={(e) => patch(row.exerciseId, { value: e.target.value })}
                />
                <span className="text-sm text-muted">kg</span>
              </div>
              <div className="mt-1.5 text-xs">
                <button
                  className="font-semibold text-clay hover:text-clay-hover"
                  onClick={() => patch(row.exerciseId, { calcOpen: !row.calcOpen, calcWeight: '', calcReps: '' })}
                >
                  {row.calcOpen ? 'Close calculator' : "Don't know it? Calculate"}
                </button>
              </div>
              {row.calcOpen && (
                <div className="mt-2 flex flex-wrap items-end gap-2 rounded-lg bg-surface p-2.5">
                  <label className="text-xs text-muted">
                    <span className="mb-1 block font-semibold uppercase tracking-wide">Weight</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      inputMode="decimal"
                      placeholder="kg"
                      className={`${inputClass} w-20 text-center`}
                      value={row.calcWeight}
                      onChange={(e) => patch(row.exerciseId, { calcWeight: e.target.value })}
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
                      className={`${inputClass} w-20 text-center`}
                      value={row.calcReps}
                      onChange={(e) => patch(row.exerciseId, { calcReps: e.target.value })}
                    />
                  </label>
                  <Button variant="outline" className="ml-auto" onClick={() => applyCalc(row)}>
                    Use {epley(row.calcWeight, row.calcReps) ? `${epley(row.calcWeight, row.calcReps)} kg` : ''}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={saveAndContinue} disabled={!allFilled || saving}>
            {saving ? 'Saving…' : 'Save & continue'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
