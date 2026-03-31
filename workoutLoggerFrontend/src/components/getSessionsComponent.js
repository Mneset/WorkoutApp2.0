import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function GetSessionsComponent() {
    const [sessions, setSessions] = useState([]);
    const { getToken, user } = useAuth();

    const handleGetSessions = async () => {
        try {
            const accessToken = await getToken();

            const response = await api.get('/session', { params: { userId: user.sub },
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
            });
            setSessions(response.data.data.result);
        } catch (error) {
            console.log('Error getting sessions:', error.response ? error.response.data : error.message);
        }
    }

    const deleteSession = async (sessionLogId) => {
        try {
            const accessToken = await getToken();

            await api.delete(`/session/${sessionLogId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
            });
            alert("Session deleted successfully!");
            handleGetSessions();
        } catch (error) {
            console.error("Error deleting session:", error);
        }
    }

    useEffect(() => {
        handleGetSessions();
    }, []);

    return (
        <div id='sessions-container'>
            { sessions && sessions.length > 0 ? (
                sessions.map((session) => (
                    <div key={session.id}>
                        <h2>
                            {new Date(session.sessionDateStart).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </h2>
                        <table>
                            <thead>
                                <tr>
                                    <th colSpan="4" style={{ fontWeight: 'bold', textAlign: 'center'}}>
                                        {session.name || 'Untitled Session'}
                                    </th>
                                </tr>
                            </thead>
                            {Array.isArray(session.ExerciseLogs) && session.ExerciseLogs.length > 0 ? (
                                Object.entries(
                                    session.ExerciseLogs.reduce((acc, log) => {
                                        const exerciseName = log.Exercise.name;
                                        if (!acc[exerciseName]) acc[exerciseName] = [];
                                        acc[exerciseName].push(log);
                                        return acc;
                                    }, {})
                                ).map(([exerciseName, logs]) => (
                                    <tbody key={exerciseName}>
                                        <tr>
                                            <td colSpan="4"  className='exercise-name' style={{ fontWeight: 'bold', textAlign: 'center'}}>
                                                {exerciseName}
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
                                                <td>{log.reps}</td>
                                                <td>{log.weight}</td>
                                                <td>{log.notes}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                ))
                            ) : (
                                <tbody>
                                    <tr>
                                        <td colSpan="4">No exercise logs found for this session.</td>
                                    </tr>
                                </tbody>
                            )}
                        </table>
                        <div className='button-group'>
                        <button className='session-button' onClick={() => {
                            window.location.href = `/new-session?sessionLogId=${session.id}`;
                        }}
                            >Edit</button>
                        <button className='session-button' onClick={() => {
                            deleteSession(session.id)}
                        }
                            >Delete</button>
                        </div>
                    </div>
                ))
            ) : (
                <div>No sessions found.</div>
            )}
        </div>
    );
};

export default GetSessionsComponent;
