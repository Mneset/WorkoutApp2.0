import React, { useState, useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import api from '../api';
import FullSessionComponent from './fullSessionModal';

function GetSessions2Component() {
    const [sessions, setSessions] = useState([]);
    const { getAccessTokenSilently, user } = useAuth0();
    const [modal, setModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    
    const toggleModal = () => {
            setModal(!modal);
        }
    
    const handleGetSessions = async (e) => {
        try {
            const accessToken = await getAccessTokenSilently({
                authorizationParams: {
                    audience: 'https://dev-n8xnfzfw0w26p6nq.us.auth0.com/api/v2/',
                    scope: "openid start:session",
                },
            }); 

            console.log("Access Token:", accessToken);

            const response = await api.get('/session', { params: { userId: user.sub }, 
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

            const response = await api.delete(`/session/${sessionLogId}`, {
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
            <div id='sessions2-container'>
                {sessions && sessions.length > 0 ? (
                    sessions.map((session => (
                        <div key={session.id} className='session-card'>
                            <button
                                className='delete-session-btn'
                                title="Delete session"
                                onClick={() => {
                                    if (window.confirm("Are you sure you want to delete this session?")) {
                                        deleteSession(session.id)
                                    }
                                }}
                            >
                                ✕
                            </button>
                            <div className='session-header'>
                                <h3>{session.name || 'Untitled Session'}</h3>
                                <p>
                                    {new Date(session.sessionDateStart).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
/*                                     hour: '2-digit',
                                    minute: '2-digit' */
                                })}
                                </p>
                            </div>
                            {Array.isArray(session.ExerciseLogs) && session.ExerciseLogs.length > 0 ? (
                                <div className='exercise-list'>
                                    {Object.entries(
                                        session.ExerciseLogs.reduce((acc, log) => {
                                            const name = log.Exercise.name;
                                            acc[name] = (acc[name] || 0) + 1;
                                            return acc;
                                        }, {})
                                    )
                                    .slice(0, 6)
                                    .map(([exerciseName, count]) => (
                                        <p key={exerciseName}>{exerciseName} {count}x</p>
                                    ))}
                                </div>
                            ) : (
                                <p>No logs found for this session.</p>
                            )}
                            <div className='session-actions'>
                                <button 
                                    className='open-btn' 
                                    onClick={() => {
                                        setSelectedSession(session);
                                        toggleModal();
                                    }}
                                >
                                    View Full Session
                                </button>
                            </div>
                        </div>
                    )))
                ) : (
                    <div className="no-sessions">
                        <p>No sessions found. Please create a new session.</p>
                    </div>
                )}
                {modal && selectedSession && (
                    <FullSessionComponent session={selectedSession} onClose={toggleModal} />
                )}
            </div>
    )
}


export default GetSessions2Component;