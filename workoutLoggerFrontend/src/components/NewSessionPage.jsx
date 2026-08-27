import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import api from '../api';
import Card from './Card';
import Button from './Button';
import ExercisePickerModal from './ExercisePickerModal';
import ScoreSelect from './ScoreSelect';
import SwipeToDelete from './SwipeToDelete';
import { partOfDay } from '../timeOfDay';

const inputClass =
  'w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm focus:border-clay focus:outline-none focus:ring-[3px] focus:ring-clay-tint';

const numInputClass =
  'w-full rounded-lg border border-line-strong bg-surface px-2 py-2.5 text-center text-sm focus:border-clay focus:outline-none focus:ring-[3px] focus:ring-clay-tint';

// RPE: 1–10 in 0.5 steps. RIR: 1–10 in whole steps. Both optional (blank = not set).
const RPE_OPTIONS = Array.from({ length: 19 }, (_, i) => 1 + i * 0.5);
const RIR_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

const dashedButtonClass =
  'w-full rounded-lg border border-dashed border-line-strong py-3 text-sm font-semibold text-clay hover:border-clay hover:bg-clay-tint';

const smallCloseClass =
  'grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-danger';

const Eyebrow = ({ children }) => (
  <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
    {children}
  </span>
);

function formatElapsed(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

// Empty input -> null (so blank RPE/RIR stay null, not 0), otherwise a number.
function numOrNull(v) {
  return v === '' || v === null || v === undefined ? null : Number(v);
}

// Default name for a freeform session, e.g. "Wednesday night session".
function defaultSessionName(d = new Date()) {
  const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
  return `${weekday} ${partOfDay(d.getHours())} session`;
}

/* -------------------------------------------------------------------------- */
/* Start-session view (logic preserved from startSessionComponent.js)         */
/* -------------------------------------------------------------------------- */
function StartSession() {
  const { getToken, user } = useAuth();
  const { handleSessionStarted } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const initRef = useRef(false);

  const startNew = async () => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = await getToken();
      const response = await api.post(
        '/session',
        { userId: user.sub },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      // Flipping the session context unmounts this view and mounts the builder.
      handleSessionStarted(response.data.data.result.sessionLogId);
    } catch (err) {
      setError('Failed to start session. Please try again.');
      console.error('Error starting session:', err);
      setLoading(false);
    }
  };

  // On open: resume the in-progress session if there is one, otherwise create a new
  // one — either way drop straight into the builder, so New Session behaves the same
  // whether or not the app still had the session in memory.
  useEffect(() => {
    if (initRef.current) return; // run once (guards against StrictMode double-invoke)
    initRef.current = true;
    const init = async () => {
      try {
        const accessToken = await getToken();
        const res = await api.get('/session', {
          params: { userId: user.sub },
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const ip = (res.data.data.result || []).find((s) => !s.sessionDateEnd) || null;
        if (ip) {
          handleSessionStarted(ip.id); // resume straight into it
        } else {
          await startNew();
        }
      } catch (err) {
        console.error('Error checking for in-progress session:', err);
        setError('Failed to start session. Please try again.');
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Card className="p-6">
          <p className="text-sm text-danger">{error}</p>
          <div className="mt-4">
            <Button onClick={startNew} disabled={loading}>
              {loading ? 'Starting…' : 'Try again'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="py-16 text-center text-sm text-muted">Loading…</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Live builder view (logic preserved from sessionContent2Component.js)       */
/* -------------------------------------------------------------------------- */
function SessionBuilder({ sessionLogId, editMode = false }) {
  const [exerciseId, setExerciseId] = useState();
  const [setId, setSetId] = useState(1);
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [session, setSession] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [sets, setSets] = useState([]);
  const [selectedExerciseName, setSelectedExerciseName] = useState('');
  const [showAddExerciseForm, setShowAddExerciseForm] = useState(false);
  const [editTableLogs, setEditTableLogs] = useState([]);
  const [sessionName, setSessionName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [modal, setModal] = useState(false);
  const [tempIdCounter, setTempIdCounter] = useState(10000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Presentational count-up timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Touch devices get swipe-to-delete for sets; mouse devices get a delete button.
  const [coarse, setCoarse] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches
  );
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(pointer: coarse)');
    const on = (e) => setCoarse(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const { getToken } = useAuth();
  const { handleSessionEnded } = useSession();
  const navigate = useNavigate();

  // Count up from the session's real start time, so resuming shows true elapsed
  // time instead of restarting from zero.
  useEffect(() => {
    if (!session?.sessionDateStart) return;
    const startMs = new Date(session.sessionDateStart).getTime();
    const tick = () => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session?.sessionDateStart]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accessToken = await getToken();

        const response = await api.get('/exercise-log', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setExercises(response.data.data.result);

        const setsResponse = await api.get('/sets', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setSets(setsResponse.data.data.result);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [getToken]);

  const toggleModal = () => {
    setModal(!modal);
  };

  const handleGetSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = await getToken();
      const response = await api.get(`/session/${sessionLogId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSession(response.data.data.result);
      setEditTableLogs(response.data.data.result.ExerciseLogs);
    } catch (err) {
      console.error('Error getting current session:', err);
      if (editMode) {
        // Editing targets a specific session; if it genuinely fails, show the error.
        setError('Failed to load session');
      } else {
        // The in-memory session pointer is stale (finished/discarded elsewhere).
        // Clear it so the page falls back to the start/resume view instead of a
        // dead "Failed to load" screen.
        handleSessionEnded();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = async (id, exerciseName) => {
    try {
      const accessToken = await getToken();
      const response = await api.post(
        '/exercise-log',
        { exerciseId: id, setId, reps, weight, notes, sessionLogId },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const newLog = response.data.data.result;
      const logEntry = {
        id: newLog.id,
        exerciseId: id,
        setId,
        reps,
        weight,
        notes,
        rpe: null,
        rir: null,
        sessionLogId,
        Exercise: { name: exerciseName },
      };

      setTempIdCounter((prev) => prev - 1);
      setEditTableLogs((prevLogs) => [...prevLogs, logEntry]);
    } catch (err) {
      alert('Failed to add exercise. Please try again.');
      console.error('Error adding exercise to session:', err);
    }
  };

  const handleEndSession = async () => {
    setSaving(true);
    try {
      await saveAllEdits();
      const accessToken = await getToken();
      await api.put(
        `/session/${sessionLogId}`,
        {
          notes: sessionNotes,
          updatedLogs: editTableLogs.map((l) => ({ ...l, rpe: numOrNull(l.rpe), rir: numOrNull(l.rir) })),
          name: sessionName,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      handleSessionEnded();
      navigate(editMode ? '/session-history' : '/');
    } catch (err) {
      alert('Failed to end session. Please try again.');
      console.error('Error ending session:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSession = async (sessionLogId) => {
    try {
      const accessToken = await getToken();
      await api.delete(`/session/${sessionLogId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      handleSessionEnded();
      navigate('/');
    } catch (err) {
      alert('Failed to cancel session. Please try again.');
      console.error('Error deleting session:', err);
    }
  };

  const saveAllEdits = async () => {
    const accessToken = await getToken();
    for (const log of editTableLogs) {
      if (log.id) {
        await api.put(
          `/exercise-log/${log.id}`,
          {
            reps: log.reps,
            weight: log.weight,
            notes: log.notes,
            rpe: numOrNull(log.rpe),
            rir: numOrNull(log.rir),
          },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      }
    }
  };

  const handleAddSet = async (exerciseName) => {
    if (document.activeElement) document.activeElement.blur();
    const logsForExercise = editTableLogs.filter((log) => log.Exercise.name === exerciseName);
    if (logsForExercise.length === 0) return;

    const lastLog = logsForExercise[logsForExercise.length - 1];

    try {
      await saveAllEdits();
      const accessToken = await getToken();
      const response = await api.post(
        '/exercise-log',
        {
          exerciseId: lastLog.exerciseId,
          setId: lastLog.setId,
          reps: lastLog.reps,
          weight: lastLog.weight,
          notes: lastLog.notes,
          rpe: numOrNull(lastLog.rpe),
          rir: numOrNull(lastLog.rir),
          sessionLogId,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const newLog = {
        ...lastLog,
        id: response.data.data.result.id,
        setId: lastLog.setId + 1,
      };
      setEditTableLogs((prevLogs) => [...prevLogs, newLog]);
    } catch (err) {
      alert('Failed to add set. Please try again.');
      console.error('Error adding set:', err);
    }
  };

  const handleDeleteSet = async (log) => {
    if (log.id) {
      try {
        const accessToken = await getToken();
        await api.delete(`/exercise-log/${log.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch (err) {
        alert('Failed to delete set. Please try again.');
        console.error('Error deleting set:', err);
        return;
      }
    }
    setEditTableLogs((prev) => prev.filter((l) => l.id !== log.id));
  };

  const deleteExercise = async (exerciseName) => {
    const logs = editTableLogs.filter((l) => l.Exercise?.name === exerciseName);
    try {
      const accessToken = await getToken();
      for (const l of logs) {
        if (l.id) {
          await api.delete(`/exercise-log/${l.id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        }
      }
    } catch (err) {
      alert('Failed to delete exercise. Please try again.');
      console.error('Error deleting exercise:', err);
      return;
    }
    setEditTableLogs((prev) => prev.filter((l) => l.Exercise?.name !== exerciseName));
  };

  useEffect(() => {
    handleGetSession();
  }, [sessionLogId]);

  useEffect(() => {
    if (session) {
      setSessionName(session.name || defaultSessionName());
      if (session.notes) {
        setSessionNotes(session.notes);
        setShowNotes(true);
      }
    }
  }, [session]);

  // Presentational running total (kg): sum of reps * weight across all sets
  const totalKg = Array.isArray(editTableLogs)
    ? editTableLogs.reduce(
        (sum, log) => sum + ((Number(log.reps) * Number(log.weight)) || 0),
        0
      )
    : 0;

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="py-16 text-center text-sm text-muted">Loading session…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Card className="p-6">
          <p className="text-sm text-danger">{error}</p>
          <div className="mt-4">
            <Button variant="outline" onClick={handleGetSession}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Group logs by exercise name (preserved grouping logic)
  const groupedLogs =
    Array.isArray(editTableLogs) && editTableLogs.length > 0
      ? Object.entries(
          editTableLogs.reduce((acc, log) => {
            const exerciseName = log.Exercise.name;
            if (!acc[exerciseName]) acc[exerciseName] = [];
            acc[exerciseName].push(log);
            return acc;
          }, {})
        )
      : [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {session && (
        <div key={session.id}>
          {/* Header — title with an edit button that toggles inline editing */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {editMode ? (
                <Eyebrow>EDITING SESSION</Eyebrow>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-clay" />
                  </span>
                  <Eyebrow>IN PROGRESS · {formatElapsed(elapsedSeconds)}</Eyebrow>
                </span>
              )}
              {editingName ? (
                <input
                  data-title
                  autoFocus
                  type="text"
                  id="sessionName"
                  name="sessionName"
                  aria-label="Session name"
                  placeholder="New session"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  onBlur={() => setEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      e.preventDefault();
                      setEditingName(false);
                    }
                  }}
                  className="mt-1 w-full bg-transparent text-2xl font-[650] tracking-[-0.02em] text-ink placeholder:text-muted focus:outline-none"
                />
              ) : (
                <div className="mt-1 flex items-center gap-1.5">
                  <h1 className={`truncate text-2xl ${sessionName ? '' : 'text-muted'}`}>
                    {sessionName || 'New session'}
                  </h1>
                  <button
                    type="button"
                    aria-label="Edit session name"
                    title="Edit name"
                    onClick={() => setEditingName(true)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-clay"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <div className="shrink-0 text-sm text-muted">
              <span className={totalKg > 0 ? 'font-bold text-clay' : 'font-semibold text-ink'}>
                {totalKg.toLocaleString()}
              </span>{' '}
              kg total
            </div>
          </div>

          {/* Session notes — optional; collapsed behind a button until wanted. */}
          {showNotes ? (
            <Card className="group mt-5 border border-clay-tintborder bg-surface-2 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-clay-tint text-clay">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 6h14M5 12h14M5 18h9" />
                    </svg>
                  </span>
                  <Eyebrow>Session notes</Eyebrow>
                </div>
                <button
                  type="button"
                  title="Remove note"
                  onClick={() => {
                    setShowNotes(false);
                    setSessionNotes('');
                  }}
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-surface hover:text-danger"
                >
                  ✕
                </button>
              </div>
              <textarea
                className={`${inputClass} mt-3 min-h-[84px] resize-y`}
                placeholder="How did the session go?"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
              />
            </Card>
          ) : (
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              className={`${dashedButtonClass} mt-5`}
            >
              + Add session note
            </button>
          )}

          {/* Exercises */}
          {groupedLogs.length > 0 && (
            <div className="mt-5 flex flex-col gap-5">
              {groupedLogs.map(([exerciseName, logs]) => (
                <Card
                  key={exerciseName}
                  className="group overflow-hidden border-0 p-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="h-1.5 w-full bg-gradient-to-r from-clay via-clay-hover to-clay" />
                  <div className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-ink">{exerciseName}</div>
                      {logs[0]?.Exercise?.muscleGroup && (
                        <span className="mt-1 inline-block rounded-full bg-clay-tint px-2 py-0.5 text-[11px] font-semibold text-clay">
                          {logs[0].Exercise.muscleGroup}
                        </span>
                      )}
                    </div>
                    <button
                      className={smallCloseClass}
                      title="Delete exercise"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this exercise?')) {
                          deleteExercise(exerciseName);
                        }
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Table header */}
                  <div className="grid grid-cols-[30px_1fr_1fr_1fr_1fr] gap-1.5 border-b border-line pb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-ink sm:grid-cols-[34px_1fr_1fr_72px_72px_1.2fr] sm:gap-2">
                    <span>Set</span>
                    <span className="text-center">Reps</span>
                    <span className="text-center">Kg</span>
                    <span
                      className="cursor-help text-center underline decoration-dotted decoration-muted underline-offset-2"
                      title="RPE — Rate of Perceived Exertion: how hard the set felt (1 easy → 10 max effort)"
                    >
                      RPE
                    </span>
                    <span
                      className="cursor-help text-center underline decoration-dotted decoration-muted underline-offset-2"
                      title="RIR — Reps In Reserve: how many more good reps you could have done"
                    >
                      RIR
                    </span>
                    <span className="hidden sm:block">Notes</span>
                  </div>

                  {/* Set rows */}
                  {logs.map((log, index) => (
                    <SwipeToDelete
                      key={`${session.id}-${log.exerciseId}-${index}`}
                      enabled={coarse}
                      onDelete={() => handleDeleteSet(log)}
                    >
                    <div
                      className={`grid grid-cols-[30px_1fr_1fr_1fr_1fr] items-center gap-1.5 py-3 sm:grid-cols-[34px_1fr_1fr_72px_72px_1.2fr] sm:gap-2 ${
                        index > 0 ? 'border-t border-line' : ''
                      }`}
                    >
                      <div className="row-span-2 flex items-center self-center sm:row-span-1">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-clay-tint text-xs font-bold text-clay">
                          {index + 1}
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        placeholder="–"
                        className={numInputClass}
                        value={log.reps}
                        onChange={(e) => {
                          if (Number(e.target.value) < 0) return;
                          const updatedLogs = [...editTableLogs];
                          const globalIndex = editTableLogs.findIndex((l) => l.id === log.id);
                          updatedLogs[globalIndex] = {
                            ...updatedLogs[globalIndex],
                            reps: e.target.value,
                          };
                          setEditTableLogs(updatedLogs);
                        }}
                        onBlur={async (e) => {
                          if (log.id) {
                            try {
                              const accessToken = await getToken();
                              await api.put(
                                `/exercise-log/${log.id}`,
                                {
                                  reps: e.target.value,
                                  weight: log.weight,
                                  notes: log.notes,
                                },
                                {
                                  headers: { Authorization: `Bearer ${accessToken}` },
                                }
                              );
                            } catch (err) {
                              console.error('Failed to save:', err);
                            }
                          }
                        }}
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="–"
                        className={numInputClass}
                        value={log.weight}
                        onChange={(e) => {
                          if (Number(e.target.value) < 0) return;
                          const updatedLogs = [...editTableLogs];
                          const globalIndex = editTableLogs.findIndex((l) => l.id === log.id);
                          updatedLogs[globalIndex] = {
                            ...updatedLogs[globalIndex],
                            weight: e.target.value,
                          };
                          setEditTableLogs(updatedLogs);
                        }}
                      />
                      <ScoreSelect
                        value={log.rpe ?? ''}
                        options={RPE_OPTIONS}
                        onChange={(v) => {
                          const updatedLogs = [...editTableLogs];
                          const globalIndex = editTableLogs.findIndex((l) => l.id === log.id);
                          updatedLogs[globalIndex] = { ...updatedLogs[globalIndex], rpe: v };
                          setEditTableLogs(updatedLogs);
                        }}
                      />
                      <ScoreSelect
                        value={log.rir ?? ''}
                        options={RIR_OPTIONS}
                        onChange={(v) => {
                          const updatedLogs = [...editTableLogs];
                          const globalIndex = editTableLogs.findIndex((l) => l.id === log.id);
                          updatedLogs[globalIndex] = { ...updatedLogs[globalIndex], rir: v };
                          setEditTableLogs(updatedLogs);
                        }}
                      />
                      <div className="col-span-4 col-start-2 mt-1.5 flex items-center gap-1.5 sm:col-span-1 sm:col-start-auto sm:mt-0">
                        <input
                          type="text"
                          placeholder="Notes"
                          className={`${inputClass} min-w-0 flex-1`}
                          value={log.notes || ''}
                          onChange={(e) => {
                            const updatedLogs = [...editTableLogs];
                            const globalIndex = editTableLogs.findIndex((l) => l.id === log.id);
                            updatedLogs[globalIndex] = {
                              ...updatedLogs[globalIndex],
                              notes: e.target.value,
                            };
                            setEditTableLogs(updatedLogs);
                          }}
                        />
                        {!coarse && (
                          <button
                            type="button"
                            title="Delete set"
                            onClick={() => handleDeleteSet(log)}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-danger"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    </SwipeToDelete>
                  ))}

                  <div className="mt-2">
                    <button className={dashedButtonClass} onClick={() => handleAddSet(exerciseName)}>
                      + Add set
                    </button>
                  </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Add exercise */}
          <div className="mt-5">
            <button className={dashedButtonClass} onClick={() => toggleModal()}>
              + Add exercise
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            {editMode ? (
              <Button variant="ghost" onClick={() => navigate('/session-history')}>
                Cancel
              </Button>
            ) : (
              <Button variant="danger" onClick={() => handleCancelSession(session.id)}>
                Discard session
              </Button>
            )}
            <Button onClick={handleEndSession} disabled={saving}>
              {saving ? 'Saving…' : editMode ? 'Save changes' : 'Finish session'}
            </Button>
          </div>
        </div>
      )}

      {modal && (
        <ExercisePickerModal
          exercises={exercises}
          onClose={toggleModal}
          onSelect={(exercise) => {
            setExerciseId(exercise.id);
            setSelectedExerciseName(exercise.name);
            handleAddExercise(exercise.id, exercise.name);
            setShowAddExerciseForm(true);
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page shell — routes between start view and live builder                    */
/* -------------------------------------------------------------------------- */
export default function NewSessionPage() {
  const { sessionStarted, sessionLogId } = useSession();
  const location = useLocation();

  // A session id can arrive by navigation state — resuming an in-progress session or
  // editing a finished one — which also survives when the in-memory context is empty
  // (e.g. after a reload). Otherwise fall back to the just-started session in context.
  const stateId = location.state?.sessionLogId ?? null;
  const editMode = !!location.state?.edit;
  const activeId = stateId ?? (sessionStarted ? sessionLogId : null);

  if (!activeId) {
    return <StartSession />;
  }

  return <SessionBuilder key={activeId} sessionLogId={activeId} editMode={editMode} />;
}