import React, { useState, useRef, useEffect } from 'react';

/**
 * Compact numeric dropdown that always opens BELOW the trigger and scrolls when
 * the list is long (native <select> can't guarantee either). Used for RPE/RIR.
 *
 *   <ScoreSelect value={log.rpe ?? ''} options={RPE_OPTIONS} onChange={(v) => ...} />
 *
 * onChange receives '' (blank) or the chosen value as a string.
 */
export default function ScoreSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const selected = value === '' || value === null || value === undefined ? '' : String(value);
  const display = selected === '' ? '–' : selected;

  const pick = (v) => {
    onChange(v);
    setOpen(false);
  };

  const optionClass = (isActive) =>
    `block w-full px-2 py-2.5 text-center text-sm hover:bg-clay-tint ${
      isActive ? 'bg-clay-tint font-semibold text-clay' : ''
    }`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-line-strong bg-surface px-2 py-2.5 text-center text-sm focus:border-clay focus:outline-none focus:ring-[3px] focus:ring-clay-tint"
      >
        <span>{display}</span>
        <svg
          className={`h-3 w-3 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-1 max-h-80 w-max min-w-[4rem] -translate-x-1/2 overflow-y-auto rounded-lg border border-line-strong bg-surface py-1 shadow-lg">
          <button type="button" onClick={() => pick('')} className={optionClass(selected === '')}>
            –
          </button>
          {[...options].reverse().map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => pick(String(v))}
              className={optionClass(String(v) === selected)}
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
