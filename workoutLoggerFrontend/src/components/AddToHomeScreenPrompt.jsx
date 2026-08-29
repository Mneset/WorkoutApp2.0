import React, { useEffect, useState } from 'react';

const DISMISS_KEY = 'a2hs-dismissed-v1';

// Decide whether to show the install hint: mobile browser, not already installed as a
// PWA, and not previously dismissed.
function detect() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return { show: false };
  const ua = navigator.userAgent || '';
  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS
  const isAndroid = /android/i.test(ua);
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true;

  let dismissed = false;
  try {
    dismissed = localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    // storage blocked (private mode) — treat as not dismissed
  }

  const platform = isIOS ? 'ios' : isAndroid ? 'android' : null;
  return { show: !!platform && !isStandalone && !dismissed, platform };
}

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 16V4" />
    <path d="m8 8 4-4 4 4" />
    <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7" />
  </svg>
);

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="12" cy="19" r="1.6" />
  </svg>
);

const PlusSquare = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M12 8v8M8 12h8" />
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

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
    setState({ show: false, platform: null });
  };

  const isIOS = state.platform === 'ios';

  const steps = isIOS
    ? [
        { icon: <ShareIcon />, text: <>Tap the <b>Share</b> button in the Safari toolbar.</> },
        { icon: <PlusSquare />, text: <>Choose <b>Add to Home Screen</b>.</> },
        { icon: null, text: <>Tap <b>Add</b> — done!</> },
      ]
    : [
        { icon: <MenuIcon />, text: <>Tap the <b>⋮ menu</b> in your browser.</> },
        { icon: <PlusSquare />, text: <>Choose <b>Install app</b> or <b>Add to Home screen</b>.</> },
        { icon: null, text: <>Confirm — done!</> },
      ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-[rgba(28,26,23,0.45)] p-4"
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-surface p-5 shadow-lg"
      >
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-clay text-lg font-bold text-white">
            W
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-[650] text-ink">Add to your home screen</h3>
            <p className="mt-0.5 text-sm text-muted">
              Install Workout Logger for a full-screen, app-like experience.
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
          >
            ✕
          </button>
        </div>

        <ol className="mt-4 space-y-2.5">
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-ink">
              <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-clay-tint text-clay">
                {s.icon || <span className="text-xs font-bold">{i + 1}</span>}
              </span>
              <span>{s.text}</span>
            </li>
          ))}
        </ol>

        <button
          onClick={dismiss}
          className="mt-5 w-full rounded-lg bg-clay py-3 text-sm font-semibold text-white hover:bg-clay-hover"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
