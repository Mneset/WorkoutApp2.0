import React, {useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import api from '../api'

const Profile = () => {
  const { user, isAuthenticated, getAccessTokenSilently} = useAuth0();
  const [ userPlanInfo, setUserPlanInfo ] = useState(null)
  
const getUserInfo = async () => {
  try {
      const accessToken = await getAccessTokenSilently({
              authorizationParams: {
                  audience: 'https://dev-n8xnfzfw0w26p6nq.us.auth0.com/api/v2/',
                  scope: "openid profile email",
              },
          });

      const response = await api.get('/users',  {
          headers: {
              Authorization: `Bearer ${accessToken}`
          },
      });

      console.log('user:', response.data.data.result)
      setUserPlanInfo(response.data.data.result)
    } catch(error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if(isAuthenticated) {
      getUserInfo()
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return <div className="profile-container">Please log in to view your profile.</div>;
  }


  return (
    isAuthenticated && (
      <div className="profile-container">
        <h1>User Profile</h1>
        <img src={user.picture} alt={user.nickname} />
        <h2>{user.nickname}</h2>
        <p>{user.email}</p>
        { userPlanInfo && (
          <div>
            <p>Current workout plan: {userPlanInfo.WorkoutPlan.name}</p>
            <p>Plan Duration: {userPlanInfo.WorkoutPlan.durationWeeks} weeks</p>
            <p>Progress: Week #{userPlanInfo.currentWeek}</p>
          </div>
        )}
      </div>
    )
  );
};

export default Profile;