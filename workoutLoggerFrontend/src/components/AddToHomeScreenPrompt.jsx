import React, { useEffect, useState } from 'react';

// "Never show again" (explicit choice) vs a snooze timestamp (accidental click-away / "later")
// so dismissing by mistake doesn't hide the hint forever — it comes back after a few days.
const NEVER_KEY = 'a2hs-never-v2';
const SNOOZE_KEY = 'a2hs-snooze-until-v2';
const SNOOZE_DAYS = 3;

// Decide whether to show the install hint: mobile browser, not already installed as a
// PWA, not permanently dismissed, and not currently snoozed.
function detect() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return { show: false };
  const ua = navigator.userAgent || '';
  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS
  const isAndroid = /android/i.test(ua);
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true;

  let never = false;
  let snoozedUntil = 0;
  try {
    never = localStorage.getItem(NEVER_KEY) === '1';
    snoozedUntil = Number(localStorage.getItem(SNOOZE_KEY) || 0);
  } catch {
    // storage blocked (private mode) — treat as first visit
  }
  const snoozed = snoozedUntil > Date.now();

  const platform = isIOS ? 'ios' : isAndroid ? 'android' : null;
  return { show: !!platform && !isStandalone && !never && !snoozed, platform };
}

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 16V4" />
    <path d="m8 8 4-4 4 4" />
    <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7" />
  </svg>
);

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="12" cy="19" r="1.7" />
  </svg>
);

const PlusSquare = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export default function AddToHomeScreenPrompt() {
  const [state, setState] = useState({ show: false, platform: null });

  useEffect(() => {
    const d = detect();
    if (!d.show) return;
    // Small delay so it doesn't slam in the instant the app loads after login.
    const t = setTimeout(() => setState({ show: true, platform: d.platform }), 900);
    return () => clearTimeout(t);
  }, []);

  if (!state.show) return null;

  const close = () => setState({ show: false, platform: null });

  // Default dismiss (click-away, ✕, "Maybe later") only snoozes — the hint returns later.
  const snooze = () => {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000));
    } catch {
      /* ignore */
    }
    close();
  };

  // Explicit opt-out — never show again.
  const never = () => {
    try {
      localStorage.setItem(NEVER_KEY, '1');
    } catch {
      /* ignore */
    }
    close();
  };

  const isIOS = state.platform === 'ios';

  const steps = isIOS
    ? [
        { icon: <ShareIcon />, text: <>Tap the <b>Share</b> icon at the bottom of Safari.</> },
        { icon: <PlusSquare />, text: <>Scroll down and tap <b>Add to Home Screen</b>.</> },
        { icon: <CheckIcon />, text: <>Tap <b>Add</b> in the top corner.</> },
      ]
    : [
        { icon: <MenuIcon />, text: <>Tap the <b>⋮ menu</b> (top-right of Chrome).</> },
        { icon: <PlusSquare />, text: <>Tap <b>Install app</b> or <b>Add to Home screen</b>.</> },
        { icon: <CheckIcon />, text: <>Tap <b>Install</b> / <b>Add</b> to confirm.</> },
      ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(28,26,23,0.55)] p-3"
      onClick={snooze}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[92vh] w-full max-w-md flex-col overflow-y-auto rounded-2xl bg-surface p-6 shadow-2xl"
      >
        <button
          onClick={snooze}
          aria-label="Close"
          className="-mr-1 -mt-1 ml-auto grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
        >
          ✕
        </button>

        {/* Hero */}
        <div className="mt-2 flex flex-col items-center text-center">
          <div className="grid h-20 w-20 flex-shrink-0 place-items-center rounded-3xl bg-clay text-4xl font-bold text-white shadow-md">
            W
          </div>
          <h3 className="mt-5 text-2xl font-[650] text-ink">Install the app on your phone</h3>
          <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-muted">
            Add it to your home screen so it opens like a real app — full-screen, no browser
            bars, and one tap away.
          </p>
        </div>

        {/* Steps take the remaining space */}
        <div className="mt-7 flex flex-1 flex-col justify-center">
          <div className="mb-3 text-center text-xs font-bold uppercase tracking-[0.1em] text-clay">
            {isIOS ? 'In Safari' : 'In Chrome'} · takes 5 seconds
          </div>
          <ol className="space-y-4">
            {steps.map((s, i) => (
              <li key={i} className="flex items-center gap-3.5 rounded-xl border border-line bg-surface-2 p-3.5 text-[15px] text-ink">
                <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-clay text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-clay-tint text-clay">
                  {s.icon}
                </span>
                <span className="min-w-0 leading-snug">{s.text}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Actions pinned to the bottom */}
        <div className="mt-6 flex-shrink-0">
          <button
            onClick={snooze}
            className="w-full rounded-xl bg-clay py-3.5 text-base font-semibold text-white hover:bg-clay-hover"
          >
            Maybe later
          </button>
          <button
            onClick={never}
            className="mt-2.5 w-full py-1.5 text-center text-xs font-medium text-muted hover:text-ink"
          >
            Don't show this again
          </button>
        </div>
      </div>
    </div>
  );
}
