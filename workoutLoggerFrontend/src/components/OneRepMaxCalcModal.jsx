import React, { useState } from 'react';
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
 * Set a 1RM for a single exercise, in place — enter it directly, or calculate it from a
 * recent weight × reps (Epley). onSet(oneRm) receives the kg value.
 */
export default function OneRepMaxCalcModal({ exerciseName, onClose, onSet }) {
  const [value, setValue] = useState('');
  const [calcWeight, setCalcWeight] = useState('');
  const [calcReps, setCalcReps] = useState('');

  const est = epley(calcWeight, calcReps);
  const canSave = Number(value) > 0;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[210] grid place-items-center bg-[rgba(28,26,23,0.45)] p-6">
      <Card onClick={(e) => e.stopPropagation()} className="w-full max-w-sm p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg">Set 1-rep max</h3>
            <p className="mt-0.5 text-sm text-muted">{exerciseName}</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            ✕
          </button>
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">1RM (kg)</span>
          <input
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
            autoFocus
            placeholder="e.g. 100"
            className={`${inputClass} w-full`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>

        <div className="mt-4 rounded-lg bg-surface-2 p-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Don't know it? Calculate from a set
          </span>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <label className="text-xs text-muted">
              <span className="mb-1 block font-semibold uppercase tracking-wide">Weight</span>
              <input
                type="number"
                min="0"
                step="0.5"
                inputMode="decimal"
                placeholder="kg"
                className={`${inputClass} w-20 text-center`}
                value={calcWeight}
                onChange={(e) => setCalcWeight(e.target.value)}
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
                value={calcReps}
                onChange={(e) => setCalcReps(e.target.value)}
              />
            </label>
            <Button variant="outline" className="ml-auto" disabled={!est} onClick={() => est && setValue(String(est))}>
              Use {est ? `${est} kg` : ''}
            </Button>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => canSave && onSet(Number(value))} disabled={!canSave}>
            Save 1RM
          </Button>
        </div>
      </Card>
    </div>
  );
}
