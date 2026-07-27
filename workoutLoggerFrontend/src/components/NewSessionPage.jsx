import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import api from '../api';
import Card from './Card';
import Button from './Button';
import ExercisePickerModal from './ExercisePickerModal';

const inputClass =
  'w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm focus:border-clay focus:outline-none focus:ring-[3px] focus:ring-clay-tint';

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

/* -------------------------------------------------------------------------- */
/* Start-session view (logic preserved from startSessionComponent.js)         */
/* -------------------------------------------------------------------------- */
function StartSession() {
  const { getToken, user } = useAuth();
  const { handleSessionStarted } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStartSession = async (e) => {
    e.preventDefault();
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
      handleSessionStarted(response.data.data.result.sessionLogId);
    } catch (err) {
      setError('Failed to start session. Please try again.');
      console.error('Error starting session:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Eyebrow>Ready to train</Eyebrow>
      <h1 className="mt-1 text-2xl">Start a new workout</h1>
      <p className="mt-1 text-muted">Log your sets and reps as you go.</p>

      <Card className="mt-6 p-6">
        <h2 className="text-lg">Start a new session</h2>
        <p className="mt-1 text-sm text-muted">
          Begin an empty session and add exercises as you lift.
        </p>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <form className="mt-5" onSubmit={handleStartSession}>
          <Button type="submit" disabled={loading}>
            {loading ? 'Starting…' : 'Start session'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Live builder view (logic preserved from sessionContent2Component.js)       */
/* -------------------------------------------------------------------------- */
function SessionBuilder({ sessionLogId }) {
  const [exerciseId, setExerciseId] = useState();
  const [setId, setSetId] = useState(1);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(100);
  const [notes, setNotes] = useState('');
  const [session, setSession] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [sets, setSets] = useState([]);
  const [selectedExerciseName, setSelectedExerciseName] = useState('');
  const [showAddExerciseForm, setShowAddExerciseForm] = useState(false);
  const [editTableLogs, setEditTableLogs] = useState([]);
  const [sessionName, setSessionName] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [modal, setModal] = useState(false);
  const [tempIdCounter, setTempIdCounter] = useState(10000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Presentational count-up timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const { getToken } = useAuth();
  const { handleSessionEnded } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
      setError('Failed to load session');
      console.error('Error getting current session:', err);
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
        { notes: sessionNotes, updatedLogs: editTableLogs, name: sessionName },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      handleSessionEnded();
      navigate('/');
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

  const deleteExercise = async (sessionId) => {
    // TODO: implement
  };

  useEffect(() => {
    handleGetSession();
  }, [sessionLogId]);

  useEffect(() => {
    if (session) {
      if (session.name) setSessionName(session.name);
      if (session.notes) setSessionNotes(session.notes);
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
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <Eyebrow>IN PROGRESS · {formatElapsed(elapsedSeconds)}</Eyebrow>
              <h1 className="mt-1 text-2xl">New session</h1>
            </div>
            <div className="text-sm text-muted">{totalKg} kg total</div>
          </div>

          {/* Session name */}
          <Card className="mt-6 p-5">
            <Eyebrow>Session name</Eyebrow>
            <div className="mt-2">
              <input
                type="text"
                id="sessionName"
                name="sessionName"
                placeholder="Enter session name..."
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className={inputClass}
              />
            </div>
          </Card>

          {/* Session notes */}
          <Card className="mt-5 p-5">
            <Eyebrow>Session notes</Eyebrow>
            <textarea
              className={`${inputClass} mt-2 min-h-[84px] resize-y`}
              placeholder="How did the session feel? (optional)"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
            />
          </Card>

          {/* Exercises */}
          {groupedLogs.length > 0 ? (
            <div className="mt-5 flex flex-col gap-5">
              {groupedLogs.map(([exerciseName, logs]) => (
                <Card key={exerciseName} className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{exerciseName}</div>
                      {logs[0]?.Exercise?.muscleGroup && (
                        <div className="text-xs text-muted">{logs[0].Exercise.muscleGroup}</div>
                      )}
                    </div>
                    <button
                      className={smallCloseClass}
                      title="Delete exercise"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this exercise?')) {
                          deleteExercise(session.id);
                        }
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Table header */}
                  <div className="grid grid-cols-[40px_1fr_1fr_1.4fr] gap-3 border-b border-line pb-2">
                    <Eyebrow>Set</Eyebrow>
                    <Eyebrow>Reps</Eyebrow>
                    <Eyebrow>Kg</Eyebrow>
                    <Eyebrow>Notes</Eyebrow>
                  </div>

                  {/* Set rows */}
                  {logs.map((log, index) => (
                    <div
                      key={`${session.id}-${log.exerciseId}-${index}`}
                      className="grid grid-cols-[40px_1fr_1fr_1.4fr] items-center gap-3 py-3"
                    >
                      <div className="text-muted">{index + 1}</div>
                      <input
                        type="number"
                        className={inputClass}
                        value={log.reps}
                        onChange={(e) => {
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
                        className={inputClass}
                        value={log.weight}
                        onChange={(e) => {
                          const updatedLogs = [...editTableLogs];
                          const globalIndex = editTableLogs.findIndex((l) => l.id === log.id);
                          updatedLogs[globalIndex] = {
                            ...updatedLogs[globalIndex],
                            weight: e.target.value,
                          };
                          setEditTableLogs(updatedLogs);
                        }}
                      />
                      <input
                        type="text"
                        className={inputClass}
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
                    </div>
                  ))}

                  <div className="mt-2">
                    <button className={dashedButtonClass} onClick={() => handleAddSet(exerciseName)}>
                      + Add set
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="mt-5 p-5">
              <p className="py-4 text-center text-sm text-muted">
                No exercise logs found for this session.
              </p>
            </Card>
          )}

          {/* Add exercise */}
          <div className="mt-5">
            <button className={dashedButtonClass} onClick={() => toggleModal()}>
              + Add exercise
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="danger" onClick={() => handleCancelSession(session.id)}>
              Discard session
            </Button>
            <Button onClick={handleEndSession} disabled={saving}>
              {saving ? 'Saving…' : 'Finish session'}
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

  if (!sessionStarted) {
    return <StartSession />;
  }

  return <SessionBuilder sessionLogId={sessionLogId} />;
}