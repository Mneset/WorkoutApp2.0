import React from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

// Shown to signed-out visitors: brand, a one-line pitch, and a single call to log in.
// No navbar — the app itself is gated behind auth.
export default function LandingPage() {
  const { loginWithRedirect } = useAuth();

  return (
    <div className="grid min-h-dvh place-items-center bg-surface px-6 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-clay text-2xl font-bold text-white shadow-sm">
          W
        </div>

        <h1 className="mt-6 text-3xl font-[650] tracking-[-0.02em] text-ink">Workout Logger</h1>
        <p className="mt-3 text-muted">
          Log your sessions, build workout plans and reusable templates, and track your
          progress — all in one place.
        </p>

        <div className="mt-8">
          <Button onClick={() => loginWithRedirect()} className="w-full">
            Log in to get started
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted">
          You'll need to sign in to use the app.
        </p>
      </div>
    </div>
  );
}
