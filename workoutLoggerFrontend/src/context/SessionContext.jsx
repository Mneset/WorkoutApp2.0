import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../api';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
    const { isAuthenticated, getToken, user } = useAuth();
    const [sessionStarted, setSessionStarted] = useState(false);
    const [sessionLogId, setSessionLogId] = useState(null);

    // Hydrate from the server on load: a session with a start but no end date is in progress.
    // This makes "active session" state survive a reload, so the UI (e.g. the bottom-nav
    // button) can reflect it app-wide, not just within the tab that started it.
    useEffect(() => {
        if (!isAuthenticated || !user?.sub) return;
        let cancelled = false;
        (async () => {
            try {
                const token = await getToken();
                const res = await api.get('/session', {
                    params: { userId: user.sub },
                    headers: { Authorization: `Bearer ${token}` },
                });
                const ip = (res.data?.data?.result || []).find((s) => !s.sessionDateEnd);
                if (!cancelled && ip) {
                    setSessionStarted(true);
                    setSessionLogId(ip.id);
                }
            } catch {
                /* best-effort; ignore */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, user, getToken]);

    const handleSessionStarted = useCallback((newSessionLogId) => {
        setSessionStarted(true);
        setSessionLogId(newSessionLogId);
    }, []);

    const handleSessionEnded = useCallback(() => {
        setSessionStarted(false);
        setSessionLogId(null);
    }, []);

    const value = {
        sessionStarted,
        sessionLogId,
        handleSessionStarted,
        handleSessionEnded,
    };

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}
