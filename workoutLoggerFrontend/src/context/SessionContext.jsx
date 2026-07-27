import React, { createContext, useContext, useState, useCallback } from 'react';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
    const [sessionStarted, setSessionStarted] = useState(false);
    const [sessionLogId, setSessionLogId] = useState(null);

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
