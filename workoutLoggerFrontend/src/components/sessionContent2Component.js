import React, { useState, useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import api from '../api';
import ExerciseListComponent from './exerciseListComponent';


function SessionContent2Component( {sessionLogId, onSessionEnd }) {
    const [exerciseId, setExerciseId] = useState();
    const [setId, setSetId] = useState(1);
    const [reps, setReps] = useState(10);
    const [weight, setWeight] = useState(100);
    const [notes, setNotes] = useState('');
    const [session, setSession] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [sets, setSets] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedExerciseName, setSelectedExerciseName] = useState('')
    const [showAddExerciseForm, setShowAddExerciseForm] = useState(false);
    const [editTableLogs, setEditTableLogs] = useState([]);
    const [sessionName, setSessionName] = useState('');
    const [modal, setModal] = useState(false);
    const [tempIdCounter, setTempIdCounter] = useState(10000)
 
    const { getAccessTokenSilently, user } = useAuth0();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const accessToken = await getAccessTokenSilently({
                    authorizationParams: {
                        audience: 'https://dev-n8xnfzfw0w26p6nq.us.auth0.com/api/v2/',
                        scope: "openid start:session",
                    },
                });

                const response = await api.get('/exercise-log', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                setExercises(response.data.exercises);

                const setsResponse = await api.get('/sets', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                setSets(setsResponse.data.setTypes);
            
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [getAccessTokenSilently]);

    const toggleModal = () => {
            setModal(!modal);
        }

    const handleGetSession = async (e) => {
        try {
            const accessToken = await getAccessTokenSilently({
                authorizationParams: {
                    audience: `https://dev-n8xnfzfw0w26p6nq.us.auth0.com/api/v2/`,
                    scope: "openid start:session",
                },
            }); 

            const response = await api.get(`/session/${sessionLogId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            setSession(response.data.session);
            setEditTableLogs(response.data.session.ExerciseLogs);
        } catch (error) {
            console.log('Error getting current session:', error.response ? error.response.data : error.message);
        }
    }

    const handleAddExercise = async (id, exerciseName) => {
        try {
            const accessToken = await getAccessTokenSilently({
                authorizationParams: {
                    audience: 'https://dev-n8xnfzfw0w26p6nq.us.auth0.com/api/v2/',
                    scope: "openid start:session",
                },
            });

            const response = await api.post('/exercise-log', {exerciseId: id, setId, reps, weight, notes, sessionLogId}, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            console.log("Exercise added to session:", response.data);
            console.log("Exercise added to session:", response.data.exerciseLog.id);

            
            const newLog = response.data.log || {
                id: response.data.exerciseLog.id,
                exerciseId: id,
                setId,
                reps,
                weight,
                notes,
                sessionLogId,
                Exercise: { name: exerciseName },
            };

            setTempIdCounter(prev => prev - 1);
            setEditTableLogs(prevLogs => [...prevLogs, newLog]);

        } catch (error) {
            console.log("Error adding exercise to session:", error);
        }
    }

    const handleEndSession = async () => {
        const notes = window.prompt("Please provide notes for the session");
        if (notes === null) {
            return
        }
        console.log("Notes for session:", notes);

        await saveAllEdits();
        
        try {
            const accessToken = await getAccessTokenSilently({
                authorizationParams: {
                    audience: `https://dev-n8xnfzfw0w26p6nq.us.auth0.com/api/v2/`,
                    scope: "openid start:session",
                },
            });

            const response = await api.put(`/session/${sessionLogId}`, {notes, updatedLogs: editTableLogs, name: sessionName}, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            
            console.log("Session ended:", response.data);
            alert("Session ended!");
            onSessionEnd()
            window.location.href = '/';
        } catch (error) {
            console.log("Error ending session:", error);      
        }
    }

    const handleCancelSession = async (sessionLogId) => {
        try {
            const accessToken = await getAccessTokenSilently({
                authorizationParams: {
                    audience: 'https://dev-n8xnfzfw0w26p6nq.us.auth0.com/api/v2/',
                    scope: "openid start:session",
                },
            });

            console.log("Access Token:", accessToken);

            const response = await api.delete(`/session/${sessionLogId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
            });
            console.log("Session deleted:", response.data);
            alert("Session was canceled successfully!");
            window.location.href = '/';
        } catch (error) {
            console.error("Error deleting session:", error);         
        }
    }

    const saveAllEdits = async () => {
        const accessToken = await getAccessTokenSilently({
            authorizationParams: {
                audience: 'https://dev-n8xnfzfw0w26p6nq.us.auth0.com/api/v2/',
                scope: "openid start:session",
            },
        });
        for (const log of editTableLogs) {
            if (log.id) {
                await api.put(`/exercise-log/${log.id}`, {
                    reps: log.reps,
                    weight: log.weight,
                    notes: log.notes,
                }, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                console.log("Updated log:", log.id, log.reps, log.weight, log.notes);
                
            }
        }
    };

 const handleAddSet = async (exerciseName) => {

    if (document.activeElement) document.activeElement.blur();
    // Find all logs for this exercise
    const logsForExercise = editTableLogs.filter(log => log.Exercise.name === exerciseName);
    if (logsForExercise.length === 0) return;

    // Get the last log for this exercise
    const lastLog = logsForExercise[logsForExercise.length - 1];

    try {
        await saveAllEdits();

        const accessToken = await getAccessTokenSilently({
            authorizationParams: {
                audience: 'https://dev-n8xnfzfw0w26p6nq.us.auth0.com/api/v2/',
                scope: "openid start:session",
            },
        });

        // Send a POST request to create a new log with the same values as the last log
        const response = await api.post('/exercise-log', {
            exerciseId: lastLog.exerciseId,
            setId: lastLog.setId,
            reps: lastLog.reps,
            weight: lastLog.weight,
            notes: lastLog.notes,
            sessionLogId
        }, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const newLog = response.data.log || {
            ...lastLog,
            id: response.data.exerciseLog.id,
            setId: lastLog.setId + 1,
        };
        setEditTableLogs(prevLogs => [...prevLogs, newLog]);
    } catch (error) {
        console.error("Error adding set:", error);
    }
};

const deleteExercise = async (sessionId) => {

}

    useEffect(() => {
        handleGetSession();
    }, [sessionLogId]);

    useEffect(() => {
        if (session && session.name) {
            setSessionName(session.name);
        }
    }, [session]);

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
                                        <td colSpan="4"  className='exercise-name' style={{ fontWeight: 'bold', textAlign: 'center'}}>
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
                                                            const accessToken = await getAccessTokenSilently({
                                                                authorizationParams: {
                                                                    audience: 'https://dev-n8xnfzfw0w26p6nq.us.auth0.com/api/v2/',
                                                                    scope: "openid start:session",
                                                                },
                                                            });
                                                            await api.put(`/exercise-log/${log.id}`, {
                                                                reps: e.target.value,
                                                                weight: log.weight,
                                                                notes: log.notes,
                                                            }, {
                                                                headers: {
                                                                    Authorization: `Bearer ${accessToken}`
                                                                }
                                                            });
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
                                                        const globalIndex = editTableLogs.findIndex(
                                                            l => l.id === log.id
                                                        );
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
                                                        const globalIndex = editTableLogs.findIndex(
                                                            l => l.id === log.id
                                                        );
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
                                            <button 
                                            className='add-button'
                                            onClick={() => handleAddSet(exerciseName)}
                                            >
                                                Add set
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="4">
                                            <button 
                                            className='add-btn'
                                            onClick={() => toggleModal()}
                                            >
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
                                        <button 
                                        className='add-btn'
                                        onClick={() => toggleModal()}
                                        >
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
                        >
                            End session
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