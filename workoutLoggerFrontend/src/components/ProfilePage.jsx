import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../context/UserContext';
import api from '../api';
import Card from './Card';
import Button from './Button';

const inputClass =
  'w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm focus:border-clay focus:outline-none focus:ring-[3px] focus:ring-clay-tint';

// Defaults when a user has no saved preferences yet.
const DEFAULT_PREFS = { showRpe: true, showRir: true, showNotes: true, basicExercisesOnly: true };

const TOGGLES = [
  { key: 'showRpe', label: 'RPE', hint: 'Rate of perceived exertion column' },
  { key: 'showRir', label: 'RIR', hint: 'Reps in reserve column' },
  { key: 'showNotes', label: 'Notes', hint: 'Per-set notes column' },
];

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${on ? 'bg-clay' : 'bg-line-strong'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

export default function ProfilePage() {
  const { getToken, user, logout } = useAuth();
  const { refreshProfile } = useUserProfile();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const headers = { Authorization: `Bearer ${await getToken()}` };
        const res = await api.get('/users', { headers });
        const u = res.data?.data?.result;
        setUsername(u?.username || user?.nickname || '');
        setEmail(u?.email || user?.email || '');
        setPrefs({ ...DEFAULT_PREFS, ...(u?.preferences || {}) });
      } catch (err) {
        console.error('Error loading profile:', err);
        setUsername(user?.nickname || '');
        setEmail(user?.email || '');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPref = (key, val) => {
    setPrefs((p) => ({ ...p, [key]: val }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const headers = { Authorization: `Bearer ${await getToken()}` };
      await api.put('/users/profile', { username: username.trim() || undefined, preferences: prefs }, { headers });
      await refreshProfile?.();
      setSaved(true);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const doLogout = () => logout({ logoutParams: { returnTo: window.location.origin } });

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="py-16 text-center text-sm text-muted">Loading…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl">Profile</h1>
      <p className="mt-1 text-muted">Your details and logging preferences.</p>

      {/* Basic info */}
      <Card className="mt-6 p-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">Basic info</span>
        <div className="mt-3 flex items-center gap-4">
          {user?.picture ? (
            <img className="h-14 w-14 rounded-full object-cover" src={user.picture} alt="" />
          ) : (
            <span className="grid h-14 w-14 place-items-center rounded-full bg-clay-tint text-lg font-bold text-clay">
              {(username || '?').slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="flex-1">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">Display name</span>
              <input
                className={inputClass}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setSaved(false);
                }}
                placeholder="Your name"
              />
            </label>
          </div>
        </div>
        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-semibold text-muted">Email</span>
          <input className={`${inputClass} cursor-not-allowed text-muted`} value={email} disabled readOnly />
        </label>
      </Card>

      {/* Exercise library */}
      <Card className="mt-4 p-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
          Exercise library
        </span>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-ink">Basic exercises only</div>
            <div className="text-xs text-muted">
              Show a curated set of common gym staples instead of the full ~870-exercise list.
            </div>
          </div>
          <Toggle
            on={prefs.basicExercisesOnly !== false}
            onChange={(v) => setPref('basicExercisesOnly', v)}
          />
        </div>
      </Card>

      {/* Logging preferences */}
      <Card className="mt-4 p-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
          Show while logging
        </span>
        <p className="mt-1 text-sm text-muted">Hide fields you don't track to keep logging tidy.</p>
        <div className="mt-3 divide-y divide-line">
          {TOGGLES.map((t) => (
            <div key={t.key} className="flex items-center justify-between gap-4 py-3">
              <div>
                <div className="text-sm font-semibold text-ink">{t.label}</div>
                <div className="text-xs text-muted">{t.hint}</div>
              </div>
              <Toggle on={!!prefs[t.key]} onChange={(v) => setPref(t.key, v)} />
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button variant="danger" onClick={doLogout}>
          Log out
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}
