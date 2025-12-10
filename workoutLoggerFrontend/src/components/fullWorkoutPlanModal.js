import React from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import api from '../api';

function FullWorkoutPlanModalComponent({ plan, onClose }) {
    const { getAccessTokenSilently, user } = useAuth0();
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    

    // Create a map of dayOffset to sessions
    const sessionsByDay = {};
    if (plan.SessionTemplates) {
        plan.SessionTemplates.forEach(session => {
            sessionsByDay[session.dayOffset] = session;
        });
    }

    const startWorkoutPlan = async () => {
        try {
            const accessToken = await getAccessTokenSilently({
                authorizationParams: {
                    audience: 'https://dev-n8xnfzfw0w26p6nq.us.auth0.com/api/v2/',
                    scope: "openid profile email",
                },
            }); 

            const today = new Date().toISOString().split('T')[0];

            const response = await api.put(`/users/${user.sub}`, 
                {
                    workoutPlanId: plan.id,
                    startDate: today,
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                })

            console.log(response)
            onClose()
        } catch(error) {
            console.error('Error starting plan:', error);
            console.error('Error response:', error.response?.data);console.error(error)
        }
    }

    return (
        <div className="workout-modal-overlay" onClick={onClose}>
            <div className="workout-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="workout-modal-close" onClick={onClose}>✕</button>
                
                <h2>{plan.name}</h2>
                <p className="modal-description">{plan.description}</p>
                <p className="modal-duration">Duration: {plan.durationWeeks} weeks</p>
                
                <div className="weekly-schedule">
                    <h3>Weekly Schedule</h3>
                    <div className="days-grid">
                        {daysOfWeek.map((day, index) => {
                            const session = sessionsByDay[index];
                            return (
                                <div key={day} className={`day-card ${session ? 'has-workout' : 'rest-day'}`}>
                                    <h4>{day}</h4>
                                    {session ? (
                                        <div className="session-info">
                                            <p className="session-name">{session.name}</p>
                                            {session.ExerciseTemplates && session.ExerciseTemplates.length > 0 && (
                                                <div className="exercise-preview">
                                                    <p className="exercise-count">
                                                        {session.ExerciseTemplates.length} exercises
                                                    </p>
                                                    <ul>
                                                        {session.ExerciseTemplates.map(ex => (
                                                            <li key={ex.id}>
                                                                {ex.Exercise?.name || 'Unknown Exercise'}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="rest-label">Rest Day</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <div className="modal-actions">
                    <button 
                    className="start-plan-btn"
                    onClick={startWorkoutPlan}>
                        Start This Plan
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FullWorkoutPlanModalComponent;