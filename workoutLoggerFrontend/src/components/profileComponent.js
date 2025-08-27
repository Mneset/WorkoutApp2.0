import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

const Profile = () => {
  const { user, isAuthenticated } = useAuth0();
  
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
      </div>
    )
  );
};

export default Profile;