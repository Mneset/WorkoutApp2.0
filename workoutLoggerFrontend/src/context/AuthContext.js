import React, { createContext, useContext, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const { getAccessTokenSilently, user, isAuthenticated, loginWithRedirect, logout } = useAuth0();

    const getToken = useCallback(async () => {
        return await getAccessTokenSilently({
            authorizationParams: {
                audience: `https://${process.env.REACT_APP_ACCESS_DOMAIN}/api/v2/`,
                scope: 'openid profile email read:current_user update:current_user_metadata start:session',
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
