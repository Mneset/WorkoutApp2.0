import React, { useState, useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import api from '../api';

function GetSessionsComponent() {
    const [sessions, setSessions] = useState([]);
    const { getAccessTokenSilently, user } = useAuth0();
    
    const handleGetSessions = async (e) => {
        try {
            const accessToken = await getAccessTokenSilently({
                authorizationParams: {
                    audience: 'https://dev-n8xnfzfw0w26p6nq.us.auth0.com/api/v2/',
                    scope: "openid start:session",
                },
            }); 

            console.log("Access Token:", accessToken);

            const response = await api.get('/session-history', { params: { userId: user.sub }, 
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
            });
                setSessions(response.data.sessions);
            console.log('Sessions for user:', response.data.sessions);
        } catch (error) {
            console.log('Error getting sessions:', error.response ? error.response.data : error.message);
        }
    }

    const deleteSession = async (sessionLogId) => {
        try {
            console.log("Sessions:", sessions);

            const accessToken = await getAccessTokenSilently({
                authorizationParams: {
                    audience: 'https://dev-n8xnfzfw0w26p6nq.us.auth0.com/api/v2/',
                    scope: "openid start:session",
                },
            });

            console.log("Access Token:", accessToken);

            const response = await api.delete(`/session-history/${sessionLogId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
            });
            console.log("Session deleted:", response.data);
            alert("Session deleted successfully!");
            handleGetSessions();
        } catch (error) {
            console.error("Error deleting session:", error);         
        }
    }

    useEffect(()=> {
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
                            console.log("Navigating to session with ID:", session.id);
                            window.location.href = `/new-session?sessionLogId=${session.id}`;
                        }}
                            >Edit</button>
                        <button className='session-button' onClick={() => {
                            console.log("Deleting session with ID:", session.id);
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