import React, { useRef, useState } from 'react';

// Fraction of the row width you must drag past to commit a delete.
const THRESHOLD = 0.65;
// How long the commit slide-out + fade runs before the row is actually removed.
const COMMIT_MS = 300;

/**
 * Full-swipe-to-delete row (touch only). Drag the row left: a red Delete panel fills
 * the width behind it. Release past THRESHOLD of the width and it commits — the row
 * slides fully out and fades, and only once that animation finishes does the caller
 * remove it. Release short of the threshold and it snaps back.
 *
 * The live offset is tracked in a ref (not just state) so the release decision reads the
 * actual final position rather than a stale batched value — otherwise a fast swipe could
 * end up stuck at full-red without committing.
 *
 * When `enabled` is false (mouse/desktop) it renders the row untouched and the caller
 * provides its own delete button.
 */
export default function SwipeToDelete({ onDelete, enabled = true, children }) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [committing, setCommitting] = useState(false);
  const dxRef = useRef(0);
  const start = useRef(null);
  const dir = useRef(null); // 'h' | 'v' | null — locked after the first move
  const committed = useRef(false); // guard so onDelete fires exactly once
  const containerRef = useRef(null);
  const widthRef = useRef(0);

  if (!enabled) return <>{children}</>;

  const move = (v) => {
    dxRef.current = v;
    setDx(v);
  };

  const onTouchStart = (e) => {
    if (committing) return;
    const t = e.touches[0];
    widthRef.current = containerRef.current?.offsetWidth || 0;
    start.current = { x: t.clientX, y: t.clientY };
    dir.current = null;
    move(0); // clear any leftover offset so a fresh swipe starts clean
    setDragging(true);
  };

  const onTouchMove = (e) => {
    if (!start.current) return;
    const t = e.touches[0];
    const dX = t.clientX - start.current.x;
    const dY = t.clientY - start.current.y;
    if (dir.current === null) {
      if (Math.abs(dX) < 6 && Math.abs(dY) < 6) return;
      dir.current = Math.abs(dX) > Math.abs(dY) ? 'h' : 'v';
    }
    if (dir.current === 'v') return; // vertical intent → let the page scroll
    const w = widthRef.current || 9999;
    let next = dX;
    if (next > 0) next = 0;
    if (next < -w) next = -w;
    move(next);
  };

  const finish = () => {
    setDragging(false);
    start.current = null;
    const w = widthRef.current || 0;
    if (w && dxRef.current <= -w * THRESHOLD) {
      // Commit: play the full slide-out + fade, then remove the row once it finishes.
      setCommitting(true);
      move(-w);
      if (!committed.current) {
        committed.current = true;
        window.setTimeout(() => onDelete(), COMMIT_MS);
      }
    } else {
      move(0); // snap back
    }
  };

  const w = widthRef.current || 0;
  const showSolid = committing || (w > 0 && dx <= -w * THRESHOLD);

  // duration-300 matches COMMIT_MS; keep them in sync if you change the timing.
  const innerTransition = dragging
    ? ''
    : committing
    ? 'transition-all duration-300 ease-out'
    : 'transition-transform duration-200 ease-out';

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-xl">
      <div
        className={`absolute inset-0 flex items-center justify-end pr-6 text-sm font-semibold text-white transition-colors ${
          showSolid ? 'bg-danger' : 'bg-danger/70'
        }`}
      >
        Delete
      </div>
      <div
        className={`relative bg-surface ${innerTransition}`}
        style={{ transform: `translateX(${dx}px)`, opacity: committing ? 0 : 1 }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={finish}
        onTouchCancel={finish}
      >
        {children}
      </div>
    </div>
  );
}
