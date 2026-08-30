import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { useUserProfile } from '../context/UserContext';
import api from '../api';
import Card from './Card';
import Button from './Button';
import SessionBuilderView, { Eyebrow } from './SessionBuilderView';
import { partOfDay } from '../timeOfDay';
import { parseDuration, formatDuration } from '../duration';

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
/* Live builder view — owns the live session state and persistence, and       */
/* renders the shared SessionBuilderView with an API-backed data adapter.      */
/* -------------------------------------------------------------------------- */
function SessionBuilder({ sessionLogId, editMode = false }) {
  const [session, setSession] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [editTableLogs, setEditTableLogs] = useState([]);
  const [sessionName, setSessionName] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const { profile } = useUserProfile();
  const prefs = profile?.preferences || null; // logging field preferences

  // Presentational count-up timer.
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const { getToken, user } = useAuth();
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
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, [getToken]);

  const handleGetSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = await getToken();
      const response = await api.get(`/session/${sessionLogId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSession(response.data.data.result);
      // Cardio durations are stored as seconds; show them as "mm:ss" in the inputs.
      setEditTableLogs(
        (response.data.data.result.ExerciseLogs || []).map((l) => ({
          ...l,
          durationSeconds: formatDuration(l.durationSeconds),
        }))
      );
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

  const handleAddExercise = async (exercise) => {
    const isCardio = exercise.type === 'cardio';
    // New exercise goes last: order = current distinct-exercise count.
    const orderIndex = new Set(editTableLogs.map((l) => l.Exercise?.name)).size;
    try {
      const accessToken = await getToken();
      const payload = isCardio
        ? { exerciseId: exercise.id, setId: 1, durationSeconds: null, distance: null, orderIndex, notes: '', sessionLogId }
        : { exerciseId: exercise.id, setId: 1, reps: '', weight: '', orderIndex, notes: '', sessionLogId };
      const response = await api.post('/exercise-log', payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const newLog = response.data.data.result;
      const logEntry = {
        id: newLog.id,
        exerciseId: exercise.id,
        setId: 1,
        orderIndex,
        notes: '',
        rpe: null,
        rir: null,
        sessionLogId,
        Exercise: { name: exercise.name, type: exercise.type },
        ...(isCardio ? { durationSeconds: '', distance: '' } : { reps: '', weight: '' }),
      };

      setEditTableLogs((prevLogs) => [...prevLogs, logEntry]);
    } catch (err) {
      alert('Failed to add exercise. Please try again.');
      console.error('Error adding exercise to session:', err);
    }
  };

  // Patch one log row in place by id (local only).
  const updateLog = (log, patch) => {
    setEditTableLogs((prev) => {
      const i = prev.findIndex((l) => l.id === log.id);
      if (i === -1) return prev;
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  };

  // Persist one set immediately (fired on blur of the reps/cardio fields).
  const commitLog = async (log) => {
    if (!log.id) return;
    const isCardio = log.Exercise?.type === 'cardio';
    const body = {
      notes: log.notes,
      rpe: numOrNull(log.rpe),
      rir: numOrNull(log.rir),
      ...(isCardio
        ? { durationSeconds: parseDuration(log.durationSeconds), distance: numOrNull(log.distance) }
        : { reps: log.reps, weight: log.weight }),
    };
    try {
      const accessToken = await getToken();
      await api.put(`/exercise-log/${log.id}`, body, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const saveAllEdits = async () => {
    const accessToken = await getToken();
    for (const log of editTableLogs) {
      if (!log.id) continue;
      const isCardio = log.Exercise?.type === 'cardio';
      const body = {
        notes: log.notes,
        rpe: numOrNull(log.rpe),
        rir: numOrNull(log.rir),
        ...(isCardio
          ? { durationSeconds: parseDuration(log.durationSeconds), distance: numOrNull(log.distance) }
          : { reps: log.reps, weight: log.weight }),
      };
      await api.put(`/exercise-log/${log.id}`, body, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
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
          updatedLogs: editTableLogs.map((l) => {
            const isCardio = l.Exercise?.type === 'cardio';
            return {
              ...l,
              rpe: numOrNull(l.rpe),
              rir: numOrNull(l.rir),
              reps: isCardio ? null : l.reps,
              weight: isCardio ? null : l.weight,
              durationSeconds: isCardio ? parseDuration(l.durationSeconds) : null,
              distance: isCardio ? numOrNull(l.distance) : null,
            };
          }),
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

  const handleCancelSession = async () => {
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

  const handleAddSet = async (exerciseName) => {
    if (document.activeElement) document.activeElement.blur();
    const logsForExercise = editTableLogs.filter((log) => log.Exercise.name === exerciseName);
    if (logsForExercise.length === 0) return;

    const lastLog = logsForExercise[logsForExercise.length - 1];

    try {
      await saveAllEdits();
      const accessToken = await getToken();
      const isCardio = lastLog.Exercise?.type === 'cardio';
      const response = await api.post(
        '/exercise-log',
        {
          exerciseId: lastLog.exerciseId,
          setId: lastLog.setId,
          orderIndex: lastLog.orderIndex,
          notes: lastLog.notes,
          rpe: numOrNull(lastLog.rpe),
          rir: numOrNull(lastLog.rir),
          // Carry the prescription placeholders onto the new set too.
          targetReps: lastLog.targetReps ?? null,
          targetWeight: lastLog.targetWeight ?? null,
          targetWeightPct: lastLog.targetWeightPct ?? null,
          targetDurationSeconds: lastLog.targetDurationSeconds ?? null,
          targetDistance: lastLog.targetDistance ?? null,
          sessionLogId,
          ...(isCardio
            ? { durationSeconds: parseDuration(lastLog.durationSeconds), distance: numOrNull(lastLog.distance) }
            : { reps: lastLog.reps, weight: lastLog.weight }),
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const newLog = {
        ...lastLog,
        id: response.data.data.result.id,
        // setId is the set TYPE (FK to the 8 set-type rows), not a counter — keep it
        // constant so there's no artificial cap on sets per exercise.
        setId: lastLog.setId,
      };
      setEditTableLogs((prevLogs) => [...prevLogs, newLog]);
    } catch (err) {
      alert('Failed to add set. Please try again.');
      console.error('Error adding set:', err);
    }
  };

  const handleDeleteSet = async (log) => {
    // Remove immediately (optimistic) so the swipe row always clears — a failed API
    // call must never leave the delete gesture stuck.
    setEditTableLogs((prev) => prev.filter((l) => l.id !== log.id));
    if (!log.id) return;
    try {
      const accessToken = await getToken();
      await api.delete(`/exercise-log/${log.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (err) {
      console.error('Error deleting set:', err);
    }
  };

  const deleteExercise = async (exerciseName) => {
    const logs = editTableLogs.filter((l) => l.Exercise?.name === exerciseName);
    setEditTableLogs((prev) => prev.filter((l) => l.Exercise?.name !== exerciseName));
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
      console.error('Error deleting exercise:', err);
    }
  };

  // Apply a new exercise order (array of names), reindexing every log and persisting
  // only the exercises whose position actually changed. Shared by the desktop arrows
  // and the mobile drag handle inside the builder view.
  const applyExerciseOrder = async (order) => {
    const orderByName = Object.fromEntries(order.map((name, i) => [name, i]));
    const changed = new Set(
      order.filter((name) => {
        const current = editTableLogs.find((l) => l.Exercise?.name === name)?.orderIndex;
        return current !== orderByName[name];
      })
    );
    if (changed.size === 0) return;
    const updated = editTableLogs.map((l) => ({
      ...l,
      orderIndex: orderByName[l.Exercise?.name] ?? l.orderIndex,
    }));
    setEditTableLogs(updated);
    try {
      const accessToken = await getToken();
      for (const l of updated) {
        if (l.id && changed.has(l.Exercise?.name)) {
          await api.put(
            `/exercise-log/${l.id}`,
            { orderIndex: l.orderIndex },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
        }
      }
    } catch (err) {
      console.error('Failed to reorder exercise:', err);
    }
  };

  // Set a 1RM for an exercise mid-session and immediately resolve its %-based targets
  // (both locally and persisted, so a reload keeps the resolved kg).
  const handleSetOneRepMax = async (exerciseId, oneRm) => {
    const resolve = (pct) => String(Math.round(((Number(oneRm) * Number(pct)) / 100) / 2.5) * 2.5);
    try {
      const accessToken = await getToken();
      const headers = { Authorization: `Bearer ${accessToken}` };
      await api.put('/one-rep-max', { userId: user.sub, exerciseId, oneRm }, { headers });
      const updated = editTableLogs.map((l) =>
        l.exerciseId === exerciseId && l.targetWeightPct != null
          ? { ...l, targetWeight: resolve(l.targetWeightPct) }
          : l
      );
      setEditTableLogs(updated);
      for (const l of updated) {
        if (l.id && l.exerciseId === exerciseId && l.targetWeightPct != null) {
          await api.put(`/exercise-log/${l.id}`, { targetWeight: l.targetWeight }, { headers });
        }
      }
    } catch (err) {
      console.error('Failed to set 1RM:', err);
    }
  };

  useEffect(() => {
    handleGetSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLogId]);

  useEffect(() => {
    if (session) {
      setSessionName(session.name || defaultSessionName());
      if (session.notes) setSessionNotes(session.notes);
    }
  }, [session]);

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

  if (!session) return null;

  const statusEyebrow = editMode ? (
    <Eyebrow>EDITING SESSION</Eyebrow>
  ) : (
    <span className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-clay" />
      </span>
      <Eyebrow>IN PROGRESS · {formatElapsed(elapsedSeconds)}</Eyebrow>
    </span>
  );

  return (
    <SessionBuilderView
      name={sessionName}
      onNameChange={setSessionName}
      statusEyebrow={statusEyebrow}
      note={sessionNotes}
      onNoteChange={setSessionNotes}
      logs={editTableLogs}
      exercises={exercises}
      onAddExercise={handleAddExercise}
      onAddSet={handleAddSet}
      onUpdateLog={updateLog}
      onCommitLog={commitLog}
      onDeleteSet={handleDeleteSet}
      onDeleteExercise={deleteExercise}
      onReorder={applyExerciseOrder}
      onSetOneRepMax={handleSetOneRepMax}
      prefs={prefs}
      footer={
        <>
          {editMode ? (
            <Button variant="ghost" onClick={() => navigate('/session-history')}>
              Cancel
            </Button>
          ) : (
            <Button variant="danger" onClick={handleCancelSession}>
              Discard session
            </Button>
          )}
          <Button onClick={handleEndSession} disabled={saving}>
            {saving ? 'Saving…' : editMode ? 'Save changes' : 'Finish session'}
          </Button>
        </>
      }
    />
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
