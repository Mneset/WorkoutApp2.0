import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Compact numeric dropdown for RPE/RIR (options shown high → low, blank = not set).
 *
 * Touch devices get a native <select> (OS picker). Mouse devices get a custom menu
 * rendered in a PORTAL with fixed positioning, so it drops below the trigger and is
 * never clipped by an ancestor card's `overflow-hidden`.
 *
 *   <ScoreSelect value={log.rpe ?? ''} options={RPE_OPTIONS} onChange={(v) => ...} />
 *
 * onChange receives '' (blank) or the chosen value as a string.
 */
export default function ScoreSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const [coarse, setCoarse] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches
  );
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  // Track pointer type (handles device-emulation / hybrid devices).
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(pointer: coarse)');
    const onChangeMq = (e) => setCoarse(e.matches);
    mq.addEventListener('change', onChangeMq);
    return () => mq.removeEventListener('change', onChangeMq);
  }, []);

  // While open: position under the trigger, close on outside click / scroll / resize.
  useEffect(() => {
    if (!open) return;
    const place = () => btnRef.current && setRect(btnRef.current.getBoundingClientRect());
    place();
    const onDoc = (e) => {
      if (btnRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    // Close on page/ancestor scroll (the fixed menu can't follow), but NOT when
    // scrolling inside the menu itself.
    const onScroll = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setOpen(false);
    };
    const onResize = () => setOpen(false);
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const selected = value === '' || value === null || value === undefined ? '' : String(value);
  const display = selected === '' ? '–' : selected;
  const highToLow = [...options].reverse();

  // Touch: native <select> → OS picker.
  if (coarse) {
    return (
      <select
        className="w-full rounded-lg border border-line-strong bg-surface px-2 py-2.5 text-center text-sm focus:border-clay focus:outline-none focus:ring-[3px] focus:ring-clay-tint"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">–</option>
        {highToLow.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
    );
  }

  const pick = (v) => {
    onChange(v);
    setOpen(false);
  };

  const optionClass = (isActive) =>
    `block w-full px-3 py-2.5 text-center text-sm hover:bg-clay-tint ${
      isActive ? 'bg-clay-tint font-semibold text-clay' : ''
    }`;

  return (
    <div className="relative">
      <button
        ref={btnRef}
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
      {open && rect &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, minWidth: rect.width }}
            className="z-[200] max-h-72 w-max overflow-y-auto rounded-lg border border-line-strong bg-surface py-1 shadow-lg"
          >
            <button type="button" onClick={() => pick('')} className={optionClass(selected === '')}>
              –
            </button>
            {highToLow.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => pick(String(v))}
                className={optionClass(String(v) === selected)}
              >
                {v}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
