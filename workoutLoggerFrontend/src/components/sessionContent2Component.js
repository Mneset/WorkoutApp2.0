import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import api from '../api';
import ExerciseListComponent from './exerciseListComponent';


function SessionContent2Component({ sessionLogId }) {
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
    const [modal, setModal] = useState(false);
    const [tempIdCounter, setTempIdCounter] = useState(10000);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    const { getToken } = useAuth();
    const { handleSessionEnded } = useSession();

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
    }

    const handleGetSession = async () => {
        setLoading(true);
        setError(null);
        try {
            const accessToken = await getToken();
            const response = await api.get(`/session/${sessionLogId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setSession(response.data.data.result);
            setEditTableLogs(response.data.data.result.ExerciseLogs);
        } catch (err) {
            setError('Failed to load session');
            console.error('Error getting current session:', err);
        } finally {
            setLoading(false);
        }
    }

    const handleAddExercise = async (id, exerciseName) => {
        try {
            const accessToken = await getToken();
            const response = await api.post('/exercise-log', {exerciseId: id, setId, reps, weight, notes, sessionLogId}, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

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

            setTempIdCounter(prev => prev - 1);
            setEditTableLogs(prevLogs => [...prevLogs, logEntry]);
        } catch (err) {
            alert('Failed to add exercise. Please try again.');
            console.error("Error adding exercise to session:", err);
        }
    }

    const handleEndSession = async () => {
        const sessionNotes = window.prompt("Please provide notes for the session");
        if (sessionNotes === null) return;

        setSaving(true);
        try {
            await saveAllEdits();
            const accessToken = await getToken();
            await api.put(`/session/${sessionLogId}`, {notes: sessionNotes, updatedLogs: editTableLogs, name: sessionName}, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            handleSessionEnded();
            window.location.href = '/';
        } catch (err) {
            alert('Failed to end session. Please try again.');
            console.error("Error ending session:", err);
        } finally {
            setSaving(false);
        }
    }

    const handleCancelSession = async (sessionLogId) => {
        try {
            const accessToken = await getToken();
            await api.delete(`/session/${sessionLogId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            handleSessionEnded();
            window.location.href = '/';
        } catch (err) {
            alert('Failed to cancel session. Please try again.');
            console.error("Error deleting session:", err);
        }
    }

    const saveAllEdits = async () => {
        const accessToken = await getToken();
        for (const log of editTableLogs) {
            if (log.id) {
                await api.put(`/exercise-log/${log.id}`, {
                    reps: log.reps,
                    weight: log.weight,
                    notes: log.notes,
                }, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
            }
        }
    };

    const handleAddSet = async (exerciseName) => {
        if (document.activeElement) document.activeElement.blur();
        const logsForExercise = editTableLogs.filter(log => log.Exercise.name === exerciseName);
        if (logsForExercise.length === 0) return;

        const lastLog = logsForExercise[logsForExercise.length - 1];

        try {
            await saveAllEdits();
            const accessToken = await getToken();
            const response = await api.post('/exercise-log', {
                exerciseId: lastLog.exerciseId,
                setId: lastLog.setId,
                reps: lastLog.reps,
                weight: lastLog.weight,
                notes: lastLog.notes,
                sessionLogId
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            const newLog = {
                ...lastLog,
                id: response.data.data.result.id,
                setId: lastLog.setId + 1,
            };
            setEditTableLogs(prevLogs => [...prevLogs, newLog]);
        } catch (err) {
            alert('Failed to add set. Please try again.');
            console.error("Error adding set:", err);
        }
    };

    const deleteExercise = async (sessionId) => {
        // TODO: implement
    }

    useEffect(() => {
        handleGetSession();
    }, [sessionLogId]);

    useEffect(() => {
        if (session && session.name) {
            setSessionName(session.name);
        }
    }, [session]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading session...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <p>{error}</p>
                <button onClick={handleGetSession}>Retry</button>
            </div>
        );
    }

    return (
        <div>
        <div id='session-container'>
        {session && (
                <div key={session.id}>
                    <table>
                        <thead>
                            <tr>
                                <th colSpan="4" style={{ fontWeight: 'bold', textAlign: 'center'}}>
                                    <label htmlFor="sessionName">Session Name: </label>
                                    <input
                                        type="text"
                                        id="sessionName"
                                        name="sessionName"
                                        placeholder="Enter session name..."
                                        value={sessionName}
                                        onChange={e => setSessionName(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </th>
                            </tr>
                        </thead>
                        {Array.isArray(editTableLogs) && editTableLogs.length > 0 ? (
                            Object.entries(
                                editTableLogs.reduce((acc, log) => {
                                    const exerciseName = log.Exercise.name;
                                    if (!acc[exerciseName]) acc[exerciseName] = [];
                                    acc[exerciseName].push(log);
                                    return acc;
                                }, {})
                            ).map(([exerciseName, logs]) => (
                                <tbody key={exerciseName}>
                                    <tr>
                                        <td colSpan="4" className='exercise-name' style={{ fontWeight: 'bold', textAlign: 'center'}}>
                                            <span>{exerciseName}</span>
                                            <button
                                                className='delete-exercise-btn'
                                                title="Delete exercise"
                                                onClick={() => {
                                                    if (window.confirm("Are you sure you want to delete this exercise?")) {
                                                        deleteExercise(session.id)
                                                    }
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Set</td>
                                        <td>Reps</td>
                                        <td>Weight</td>
                                        <td>Notes</td>
                                    </tr>
                                    {logs.map((log, index) => (
                                        <tr key={`${session.id}-${log.exerciseId}-${index}`}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={log.reps}
                                                    onChange={e => {
                                                        const updatedLogs = [...editTableLogs];
                                                        const globalIndex = editTableLogs.findIndex(l => l.id === log.id);
                                                        updatedLogs[globalIndex] = {
                                                            ...updatedLogs[globalIndex],
                                                            reps: e.target.value
                                                        };
                                                        setEditTableLogs(updatedLogs);
                                                    }}
                                                    onBlur={async (e) => {
                                                        if (log.id) {
                                                            try {
                                                                const accessToken = await getToken();
                                                                await api.put(`/exercise-log/${log.id}`, {
                                                                    reps: e.target.value,
                                                                    weight: log.weight,
                                                                    notes: log.notes,
                                                                }, {
                                                                    headers: { Authorization: `Bearer ${accessToken}` }
                                                                });
                                                            } catch (err) {
                                                                console.error('Failed to save:', err);
                                                            }
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={log.weight}
                                                    onChange={e => {
                                                        const updatedLogs = [...editTableLogs];
                                                        const globalIndex = editTableLogs.findIndex(l => l.id === log.id);
                                                        updatedLogs[globalIndex] = {
                                                            ...updatedLogs[globalIndex],
                                                            weight: e.target.value
                                                        };
                                                        setEditTableLogs(updatedLogs);
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={log.notes || ""}
                                                    onChange={e => {
                                                        const updatedLogs = [...editTableLogs];
                                                        const globalIndex = editTableLogs.findIndex(l => l.id === log.id);
                                                        updatedLogs[globalIndex] = {
                                                            ...updatedLogs[globalIndex],
                                                            notes: e.target.value
                                                        };
                                                        setEditTableLogs(updatedLogs);
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td colSpan="4">
                                            <button className='add-button' onClick={() => handleAddSet(exerciseName)}>
                                                Add set
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="4">
                                            <button className='add-btn' onClick={() => toggleModal()}>
                                                Add new Exercise
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            ))
                        ) : (
                            <tbody>
                                <tr>
                                    <td colSpan="4">No exercise logs found for this session.</td>
                                </tr>
                                <tr>
                                    <td colSpan="4">
                                        <button className='add-btn' onClick={() => toggleModal()}>
                                            Add Exercise
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        )}
                    </table>
                    <div className='button-group'>
                        <button
                            className='session-button'
                            onClick={() => handleCancelSession(session.id)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className='session-button'
                            onClick={handleEndSession}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'End session'}
                        </button>
                    </div>
                </div>
            )}
         </div>
          {modal && (
                    <ExerciseListComponent
                        exercises={exercises}
                        onClose={toggleModal}
                        onSelect={exercise => {
                            setExerciseId(exercise.id);
                            setSelectedExerciseName(exercise.name);
                            handleAddExercise(exercise.id, exercise.name);
                            setShowAddExerciseForm(true);
                        }}
                    />
                )}
        </div>
    )
}

export default SessionContent2Component;
