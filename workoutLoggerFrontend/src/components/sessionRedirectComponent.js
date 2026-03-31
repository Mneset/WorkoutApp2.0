import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import api from '../api';

const SesssionRedirectComponent = () => {
    const { getToken, user } = useAuth();
    const { handleSessionStarted } = useSession();
    const navigate = useNavigate();
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
            navigate("/new-session");
        } catch (err) {
            setError('Failed to start session');
            console.error("Error starting session:", err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='session-redirect-container'>
            <h2>Start a new session</h2>
            {error && <p className="error-container" style={{padding: '8px', fontSize: '14px'}}>{error}</p>}
            <form className='start-session-form' onSubmit={handleStartSession}>
                <button type="submit" disabled={loading}>
                    {loading ? 'Starting...' : 'Start session'}
                </button>
            </form>
        </div>
    )
}

export default SesssionRedirectComponent;
