import React, { createContext, useContext, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const { getAccessTokenSilently, user, isAuthenticated, loginWithRedirect, logout } = useAuth0();

    const getToken = useCallback(async () => {
        return await getAccessTokenSilently({
            authorizationParams: {
                audience: process.env.REACT_APP_API_AUDIENCE,
                scope: 'openid profile email start:session',
            },
        });
    }, [getAccessTokenSilently]);

    const value = {
        user,
        isAuthenticated,
        loginWithRedirect,
        logout,
        getToken,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
