import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import api from '../api';

function StartSessionComponent() {
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
            const response = await api.post('/session', { userId: user.sub }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            handleSessionStarted(response.data.data.result.sessionLogId);
        } catch (err) {
            setError('Failed to start session. Please try again.');
            console.error("Error starting session:", err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="start-session-container-wrapper">
            <h1>Start a new workout</h1>
            <div className="start-session-container">
                <h2>Start a new session</h2>
                {error && (
                    <div className="error-container">
                        <p>{error}</p>
                    </div>
                )}
                <form className='start-session-form' onSubmit={handleStartSession}>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Starting...' : 'Start session'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default StartSessionComponent;
