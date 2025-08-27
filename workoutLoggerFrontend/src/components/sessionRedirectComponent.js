import React, { useState, useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from 'react-router-dom';
import api from '../api';

const SesssionRedirectComponent = ({ onSessionStart }) => {
    const { getAccessTokenSilently, user } = useAuth0();
    const navigate = useNavigate();

     const handleStartSession = async (e) => {
        e.preventDefault();
        try {
            const accessToken = await getAccessTokenSilently({
                authorizationParams: {
                    audience: 'https://dev-n8xnfzfw0w26p6nq.us.auth0.com/api/v2/',
                    scope: "openid start:session",
                },
            });

            console.log('user.sub:', user.sub);
            console.log("Access Token:", accessToken);
            
            const response = await api.post('/session', {userId: user.sub}, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });

            console.log("Session started:", response);
            alert("Session started!");
            onSessionStart(response.data.sessionLogId);
            navigate("/new-session")
        } catch (error) {
            console.error("Error starting session:", error);      
        }
    }

    return (
        <div className='session-redirect-container'>
            <h2>Start a new session</h2>
            <form className='start-session-form' onSubmit={handleStartSession}>
                <button type="submit">Start session</button>
            </form>
        </div>
    )
}

export default SesssionRedirectComponent;