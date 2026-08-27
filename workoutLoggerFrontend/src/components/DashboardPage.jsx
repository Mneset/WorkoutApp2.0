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

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(date) {
  const x = startOfDay(date);
  const dow = (x.getDay() + 6) % 7; // Mon=0
  x.setDate(x.getDate() - dow);
  return x;
}

// Derive the four dashboard stat tiles from the loaded sessions.
function computeStats(sessions) {
  const weekStart = startOfWeek(new Date());
  let thisWeek = 0;
  let weekVolume = 0;
  let durationSum = 0;
  let durationCount = 0;
  let best = null;

  for (const s of sessions || []) {
    const start = s.sessionDateStart ? new Date(s.sessionDateStart) : null;
    const logs = Array.isArray(s.ExerciseLogs) ? s.ExerciseLogs : [];

    if (start && start >= weekStart) {
      thisWeek += 1;
      for (const l of logs) {
        weekVolume += (Number(l.reps) || 0) * (Number(l.weight) || 0);
      }
    }

    if (start && s.sessionDateEnd) {
      const mins = (new Date(s.sessionDateEnd) - start) / 60000;
      if (mins > 0 && mins < 24 * 60) {
        durationSum += mins;
        durationCount += 1;
      }
    }

    for (const l of logs) {
      const w = Number(l.weight) || 0;
      if (w > 0 && (!best || w > best.weight)) {
        best = { weight: w, name: l.Exercise?.name };
      }
    }
  }

  return {
    thisWeek,
    weekVolume,
    avgSession: durationCount ? Math.round(durationSum / durationCount) : null,
    best,
  };
}

// Parse a date-only value to LOCAL midnight, avoiding a UTC-shift off-by-one.
function parseLocalDate(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return startOfDay(new Date(value));
}

function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

// Schedule state for the active plan's weekly template (dayOffset: Mon=0..Sun=6),
// never earlier than the plan's start date. Also reports whether today's planned
// session has already been logged, so we can advance to the next one.
function planSchedule(plan, sessions) {
  const templates = plan?.WorkoutPlan?.SessionTemplates;
  if (!Array.isArray(templates) || templates.length === 0) return null;

  const today = startOfDay(new Date());
  const start = parseLocalDate(plan?.planStartDate);
  const from = start && start > today ? start : today; // never before the plan begins
  const fromDow = (from.getDay() + 6) % 7; // Mon=0..Sun=6

  // Soonest template at least `minDays` from `from` (minDays=1 skips today).
  const soonest = (minDays) => {
    let best = null;
    for (const t of templates) {
      let daysUntil = ((t.dayOffset - fromDow) + 7) % 7;
      if (daysUntil < minDays) daysUntil += 7;
      if (!best || daysUntil < best.daysUntil) best = { session: t, daysUntil };
    }
    if (!best) return null;
    const date = new Date(from);
    date.setDate(from.getDate() + best.daysUntil);
    return {
      name: best.session.name,
      id: best.session.id,
      date,
      isToday: isSameDay(date, today),
    };
  };

  const due = soonest(0); // may be today
  // Today's planned session counts as done only when a session for that template was
  // started today AND finished (has an end date) — an unfinished/abandoned start must
  // not mark the day complete.
  const todayDone =
    due?.isToday &&
    (sessions || []).some(
      (s) =>
        s.sessionTemplateId === due.id &&
        s.sessionDateStart &&
        s.sessionDateEnd &&
        isSameDay(new Date(s.sessionDateStart), today)
    );

  if (todayDone) {
    return { todayDone: true, completedName: due.name, next: soonest(1) };
  }
  return { todayDone: false, next: due };
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
  const [resumePrompt, setResumePrompt] = useState(null);

  // A session with a start but no end date is "in progress" (only one allowed).
  const inProgress = sessions.find((s) => !s.sessionDateEnd) || null;

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

  const doStartSession = async (sessionTemplateId) => {
    setStarting(true);
    try {
      const token = await getToken();
      const body = { userId: user.sub };
      if (sessionTemplateId) body.sessionTemplateId = sessionTemplateId;
      const res = await api.post('/session', body, { headers: { Authorization: `Bearer ${token}` } });
      handleSessionStarted(res.data.data.result.sessionLogId);
      navigate('/new-session');
    } catch (err) {
      console.error('Error starting session:', err);
      setStarting(false);
    }
  };

  // Never start a second session while one is in progress — prompt to resume/discard.
  const startSession = (sessionTemplateId) => {
    if (inProgress) {
      setResumePrompt({ templateId: sessionTemplateId ?? null });
      return;
    }
    doStartSession(sessionTemplateId);
  };

  const resumeInProgress = () => {
    if (!inProgress) return;
    handleSessionStarted(inProgress.id);
    navigate('/new-session');
  };

  const deleteInProgress = async () => {
    const token = await getToken();
    await api.delete(`/session/${inProgress.id}`, { headers: { Authorization: `Bearer ${token}` } });
  };

  const discardInProgress = async () => {
    if (!inProgress) return;
    if (!window.confirm('This deletes your in-progress workout. Continue?')) return;
    try {
      await deleteInProgress();
      loadData();
    } catch (err) {
      alert('Failed to discard session. Please try again.');
      console.error('Error discarding session:', err);
    }
  };

  const discardAndStart = async (templateId) => {
    try {
      if (inProgress) await deleteInProgress();
      setResumePrompt(null);
      doStartSession(templateId);
    } catch (err) {
      alert('Failed to start a new session. Please try again.');
      console.error('Error discarding session:', err);
    }
  };

  // History-style lists and stats use finished sessions only.
  const finishedSessions = sessions.filter((s) => s.sessionDateEnd);
  const recent = [...finishedSessions]
    .sort((a, b) => new Date(b.sessionDateStart || 0) - new Date(a.sessionDateStart || 0))
    .slice(0, 4);
  const schedule = planSchedule(plan, sessions);
  const next = schedule?.next;
  const stats = computeStats(finishedSessions);

  // Greeting subtitle that reflects the user's actual state instead of a generic line.
  let subtitle;
  if (inProgress) {
    subtitle = 'You have a workout in progress.';
  } else if (plan?.WorkoutPlan) {
    const planName = plan.WorkoutPlan.name;
    if (schedule?.todayDone) {
      subtitle = "That's today's session done — nice work.";
    } else if (next?.isToday) {
      subtitle = `On your plan today: ${next.name}.`;
    } else {
      subtitle = `Week ${plan.currentWeek} of ${plan.WorkoutPlan.durationWeeks} · ${planName}.`;
    }
  } else {
    subtitle = 'Ready when you are — start a session or set up a plan.';
  }
  const volume =
    stats.weekVolume >= 1000
      ? { value: (stats.weekVolume / 1000).toFixed(1), unit: 't' }
      : { value: stats.weekVolume.toLocaleString(), unit: 'kg' };
  const statCards = [
    { label: 'Sessions this week', value: String(stats.thisWeek) },
    { label: 'Volume this week', value: volume.value, unit: volume.unit },
    { label: 'Avg session time', value: stats.avgSession != null ? String(stats.avgSession) : '—', unit: stats.avgSession != null ? 'min' : '' },
    { label: 'Heaviest lift', value: stats.best ? String(stats.best.weight) : '—', unit: stats.best ? 'kg' : '', sub: stats.best?.name },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-8">
      <div className="mb-7 flex flex-col items-start justify-between gap-5 sm:flex-row">
        <div>
          <Eyebrow>{dateLabel}</Eyebrow>
          <h1 className="mt-2 text-3xl">{greetingFor(now.getHours())}, {user?.nickname || 'there'}</h1>
          <p className="mt-1 text-muted">{subtitle}</p>
        </div>
        {inProgress ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={discardInProgress}>Discard</Button>
            <Button onClick={resumeInProgress}>Resume workout</Button>
          </div>
        ) : (
          <Button onClick={() => startSession()} disabled={starting}>
            {starting ? 'Starting…' : 'Start a session'}
          </Button>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((c) => (
          <Card key={c.label} className="p-5">
            <Eyebrow>{c.label}</Eyebrow>
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${c.value === '—' ? 'text-muted' : 'text-ink'}`}>
                {c.value}
              </span>
              {c.unit && <span className="text-sm font-medium text-muted">{c.unit}</span>}
            </div>
            {c.sub && <div className="mt-0.5 truncate text-xs text-muted">{c.sub}</div>}
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

          <div
            className={`flex flex-1 flex-col rounded-2xl p-6 ${
              !schedule?.todayDone && next?.isToday
                ? 'border border-clay-tintborder bg-clay-tint'
                : 'border border-line bg-surface shadow-sm'
            }`}
          >
            {!schedule ? (
              <>
                <Eyebrow>Next session</Eyebrow>
                <p className="mt-2 text-sm text-muted">Start a plan to see your next session.</p>
              </>
            ) : schedule.todayDone ? (
              <>
                <Eyebrow>Today's plan</Eyebrow>
                <div className="mt-2 flex items-center gap-2">
                  <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-clay text-[13px] font-bold text-white">✓</span>
                  <h2 className="text-xl">Workout complete</h2>
                </div>
                <p className="mt-1 text-sm text-muted">{schedule.completedName} is done for today. Nice work.</p>
                {next && (
                  <div className="mt-4 border-t border-line pt-4">
                    <Eyebrow>Next session</Eyebrow>
                    <div className="mt-1 text-[15px] font-semibold">{next.name}</div>
                    <p className="mt-0.5 text-sm text-muted">
                      {next.isToday
                        ? 'Later today'
                        : next.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <Eyebrow>Next session</Eyebrow>
                <h2 className="mt-2 text-xl">{next.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {next.isToday
                    ? 'Today'
                    : next.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                {next.isToday && (
                  <Button className="mt-4 w-full" onClick={() => startSession(next.id)} disabled={starting}>
                    {starting ? 'Starting…' : 'Start session'}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {resumePrompt && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-[rgba(28,26,23,0.45)] p-6"
          onClick={() => setResumePrompt(null)}
        >
          <Card className="w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg">Session in progress</h2>
            <p className="mt-1 text-sm text-muted">
              You already have a workout in progress. Resume it, or discard it and start a new one.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={resumeInProgress}>Resume workout</Button>
              <Button variant="danger" onClick={() => discardAndStart(resumePrompt.templateId)}>
                Discard &amp; start new
              </Button>
              <Button variant="ghost" onClick={() => setResumePrompt(null)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
