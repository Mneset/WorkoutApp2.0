import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function FullWorkoutPlanModalComponent({ plan, onClose }) {
    const { getToken, user } = useAuth();
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const sessionsByDay = {};
    if (plan.SessionTemplates) {
        plan.SessionTemplates.forEach(session => {
            sessionsByDay[session.dayOffset] = session;
        });
    }

    const startWorkoutPlan = async () => {
        setLoading(true);
        setError(null);
        try {
            const accessToken = await getToken();
            const today = new Date().toISOString().split('T')[0];

            await api.put(`/users/${user.sub}`,
                { workoutPlanId: plan.id, startDate: today },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            onClose();
        } catch (err) {
            const msg = err.response?.data?.data?.message || 'Failed to start plan';
            setError(msg);
            console.error('Error starting plan:', err);
        } finally {
            setLoading(false);
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

                {error && (
                    <div className="error-container" style={{padding: '8px'}}>
                        <p>{error}</p>
                    </div>
                )}

                <div className="modal-actions">
                    <button
                        className="start-plan-btn"
                        onClick={startWorkoutPlan}
                        disabled={loading}
                    >
                        {loading ? 'Starting...' : 'Start This Plan'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FullWorkoutPlanModalComponent;
