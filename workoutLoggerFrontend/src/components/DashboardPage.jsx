import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import api from '../api';
import Card from './Card';
import Button from './Button';

function greetingFor(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const Eyebrow = ({ children }) => (
  <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">{children}</span>
);

export default function DashboardPage() {
  const { user, getToken, isAuthenticated } = useAuth();
  const { handleSessionStarted } = useSession();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [plan, setPlan] = useState(null);
  const [starting, setStarting] = useState(false);

  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const loadData = async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const s = await api.get('/session', { params: { userId: user.sub }, headers });
      setSessions(s.data.data.result || []);
      try {
        const u = await api.get('/users', { headers });
        setPlan(u.data.data.result || null);
      } catch (err) {
        if (err.response?.status !== 404) throw err;
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const startSession = async () => {
    setStarting(true);
    try {
      const token = await getToken();
      const res = await api.post('/session', { userId: user.sub }, { headers: { Authorization: `Bearer ${token}` } });
      handleSessionStarted(res.data.data.result.sessionLogId);
      navigate('/new-session');
    } catch (err) {
      console.error('Error starting session:', err);
      setStarting(false);
    }
  };

  const recent = [...sessions]
    .sort((a, b) => new Date(b.sessionDateStart || 0) - new Date(a.sessionDateStart || 0))
    .slice(0, 4);
  const stats = ['This week', 'Volume', 'Avg session', 'Best lift'];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-8">
      <div className="mb-7 flex flex-col items-start justify-between gap-5 sm:flex-row">
        <div>
          <Eyebrow>{dateLabel}</Eyebrow>
          <h1 className="mt-2 text-3xl">{greetingFor(now.getHours())}, {user?.nickname || 'there'}</h1>
          <p className="mt-1 text-muted">Ready when you are — start a session or pick up a plan.</p>
        </div>
        <Button onClick={startSession} disabled={starting}>{starting ? 'Starting…' : 'Start a session'}</Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((label) => (
          <Card key={label} className="p-5">
            <Eyebrow>{label}</Eyebrow>
            <div className="mt-2.5 text-2xl font-bold text-muted">—</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
        <Card className="p-6">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-lg">Recent sessions</h2>
            <span
              className="cursor-pointer text-sm font-semibold text-clay hover:text-clay-hover"
              onClick={() => navigate('/session-history')}
            >
              View all
            </span>
          </div>
          {recent.length > 0 ? (
            recent.map((s) => {
              const d = s.sessionDateStart ? new Date(s.sessionDateStart) : null;
              const logs = Array.isArray(s.ExerciseLogs) ? s.ExerciseLogs : [];
              const exCount = new Set(logs.map((l) => l.Exercise?.name)).size;
              return (
                <div
                  key={s.id}
                  onClick={() => navigate('/session-history', { state: { openSessionId: s.id } })}
                  className="group flex cursor-pointer items-center gap-4 border-t border-line py-3.5 first:border-t-0"
                >
                  <div className="grid h-11 w-11 flex-shrink-0 place-content-center rounded-[10px] border border-line bg-surface-2 text-center">
                    <b className="text-sm leading-none">{d ? d.getDate() : '–'}</b>
                    <span className="mt-0.5 block text-[9px] uppercase tracking-wide text-muted">
                      {d ? d.toLocaleDateString('en-GB', { month: 'short' }) : ''}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[15px] font-semibold transition-colors group-hover:text-clay">{s.name || 'Untitled session'}</h4>
                    <p className="mt-0.5 text-[13px] text-muted">{exCount} exercises · {logs.length} sets</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-sm text-muted">No sessions logged yet.</div>
          )}
        </Card>

        <div className="flex flex-col gap-5">
          <Card className="p-6">
            <h2 className="mb-3 text-lg">Your plan</h2>
            {plan?.WorkoutPlan ? (
              <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
                <div>
                  <div className="text-sm font-semibold">{plan.WorkoutPlan.name}</div>
                  <div className="mt-0.5 text-xs text-muted">Week {plan.currentWeek} of {plan.WorkoutPlan.durationWeeks}</div>
                </div>
                <span className="rounded-full bg-clay-tint px-2.5 py-1 text-xs font-semibold text-clay">Active</span>
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted">No active plan.</div>
            )}
          </Card>

          <div className="rounded-2xl border border-clay-tintborder bg-clay-tint p-6">
            <Eyebrow>Streak</Eyebrow>
            <h2 className="my-2 text-3xl">—</h2>
            <p className="text-sm text-clay-ink">Weekly training streak will show here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
