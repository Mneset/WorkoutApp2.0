import React, { useRef, useState } from 'react';

/**
 * Full-swipe-to-delete row (touch only). Drag the row left: a red Delete panel
 * fills the whole width behind it. Release past the halfway point and it commits
 * the delete (sliding fully out); release short of halfway and it snaps back.
 *
 * When `enabled` is false (mouse/desktop) it just renders the row untouched and
 * the caller provides its own delete button.
 */
export default function SwipeToDelete({ onDelete, enabled = true, children }) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [committing, setCommitting] = useState(false);
  const start = useRef(null);
  const dir = useRef(null); // 'h' | 'v' | null — locked after the first move
  const containerRef = useRef(null);
  const widthRef = useRef(0);

  if (!enabled) return <>{children}</>;

  const onTouchStart = (e) => {
    if (committing) return;
    const t = e.touches[0];
    widthRef.current = containerRef.current?.offsetWidth || 0;
    start.current = { x: t.clientX, y: t.clientY };
    dir.current = null;
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
    const min = -(widthRef.current || 9999);
    let next = dX;
    if (next > 0) next = 0;
    if (next < min) next = min;
    setDx(next);
  };

  const onTouchEnd = () => {
    setDragging(false);
    const w = widthRef.current || 0;
    if (w && dx <= -w / 2) {
      // Past halfway → commit: slide fully out, then remove.
      setCommitting(true);
      setDx(-w);
      window.setTimeout(() => onDelete(), 180);
    } else {
      setDx(0);
    }
    start.current = null;
  };

  const w = widthRef.current || 0;
  const past = committing || (w > 0 && dx <= -w / 2);

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-xl">
      <div
        className={`absolute inset-0 flex items-center justify-end pr-6 text-sm font-semibold text-white transition-colors ${
          past ? 'bg-danger' : 'bg-danger/70'
        }`}
      >
        Delete
      </div>
      <div
        className={`relative bg-surface ${dragging ? '' : 'transition-transform duration-200'}`}
        style={{ transform: `translateX(${dx}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
