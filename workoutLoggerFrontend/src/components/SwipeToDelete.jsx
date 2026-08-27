import React, { useRef, useState } from 'react';

const ACTION_W = 88; // px width of the revealed delete action
const THRESHOLD = 56; // px of leftward swipe needed to snap open

/**
 * Wraps a row so it can be swiped left (on touch) to reveal a red Delete action —
 * the familiar iOS list gesture. When `enabled` is false (e.g. mouse/desktop) it
 * just renders the row untouched, and the caller shows its own delete button.
 */
export default function SwipeToDelete({ onDelete, enabled = true, children }) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const openRef = useRef(false);
  const start = useRef(null);
  const dir = useRef(null); // 'h' | 'v' | null — locked after the first move

  if (!enabled) return <>{children}</>;

  const onTouchStart = (e) => {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY, base: openRef.current ? -ACTION_W : 0 };
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
    let next = start.current.base + dX;
    if (next > 0) next = 0;
    if (next < -ACTION_W) next = -ACTION_W;
    setDx(next);
  };

  const onTouchEnd = () => {
    setDragging(false);
    const shouldOpen = dx <= -THRESHOLD;
    openRef.current = shouldOpen;
    setDx(shouldOpen ? -ACTION_W : 0);
    start.current = null;
  };

  const close = () => {
    openRef.current = false;
    setDx(0);
  };

  return (
    <div className="relative overflow-hidden">
      <button
        type="button"
        tabIndex={-1}
        onClick={() => {
          onDelete();
          close();
        }}
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-danger text-sm font-semibold text-white"
        style={{ width: ACTION_W }}
      >
        Delete
      </button>
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
