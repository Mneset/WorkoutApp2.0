import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from '../api'

const Profile = () => {
  const { user, isAuthenticated, getToken } = useAuth();
  const [userPlanInfo, setUserPlanInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getUserInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = await getToken();
      const response = await api.get('/users', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUserPlanInfo(response.data.data.result);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError('Failed to load profile info');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      getUserInfo();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <div className="profile-container">Please log in to view your profile.</div>;
  }

  return (
    <div className="profile-container">
      <h1>User Profile</h1>
      <img src={user.picture} alt={user.nickname} />
      <h2>{user.nickname}</h2>
      <p>{user.email}</p>
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      )}
      {error && (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={getUserInfo}>Retry</button>
        </div>
      )}
      {!loading && !error && userPlanInfo && (
        <div>
          <p>Current workout plan: {userPlanInfo.WorkoutPlan.name}</p>
          <p>Plan Duration: {userPlanInfo.WorkoutPlan.durationWeeks} weeks</p>
          <p>Progress: Week #{userPlanInfo.currentWeek}</p>
        </div>
      )}
    </div>
  );
};

export default Profile;
