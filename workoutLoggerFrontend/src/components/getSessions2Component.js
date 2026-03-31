import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import FullSessionComponent from './fullSessionModal';

function GetSessions2Component() {
    const [sessions, setSessions] = useState([]);
    const { getToken, user } = useAuth();
    const [modal, setModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const toggleModal = () => {
        setModal(!modal);
    }

    const handleGetSessions = async () => {
        setLoading(true);
        setError(null);
        try {
            const accessToken = await getToken();
            const response = await api.get('/session', {
                params: { userId: user.sub },
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            setSessions(response.data.data.result);
        } catch (err) {
            setError('Failed to load sessions');
            console.error('Error getting sessions:', err);
        } finally {
            setLoading(false);
        }
    }

    const deleteSession = async (sessionLogId) => {
        try {
            const accessToken = await getToken();
            await api.delete(`/session/${sessionLogId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            handleGetSessions();
        } catch (err) {
            alert('Failed to delete session. Please try again.');
            console.error("Error deleting session:", err);
        }
    }

    useEffect(() => {
        handleGetSessions();
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading sessions...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <p>{error}</p>
                <button onClick={handleGetSessions}>Retry</button>
            </div>
        );
    }

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
                    <p>No sessions found. Start a new workout!</p>
                </div>
            )}
            {modal && selectedSession && (
                <FullSessionComponent session={selectedSession} onClose={toggleModal} />
            )}
        </div>
    )
}

export default GetSessions2Component;
