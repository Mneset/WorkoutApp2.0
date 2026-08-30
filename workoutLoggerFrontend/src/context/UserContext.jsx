import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../api';

const UserContext = createContext(null);

/**
 * App-wide copy of the signed-in user's own profile (display name, email, preferences)
 * from our backend — so the navbar, profile page and session builder all read the same
 * source and reflect edits immediately after a save (rather than the Auth0 token's fields).
 */
export function UserProvider({ children }) {
  const { getToken, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);

  const refreshProfile = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${await getToken()}` };
      const res = await api.get('/users', { headers });
      const u = res.data?.data?.result;
      if (u) setProfile({ username: u.username, email: u.email, preferences: u.preferences || null });
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }, [getToken]);

  useEffect(() => {
    if (isAuthenticated) refreshProfile();
  }, [isAuthenticated, refreshProfile]);

  return (
    <UserContext.Provider value={{ profile, setProfile, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserContext) || {};
}
