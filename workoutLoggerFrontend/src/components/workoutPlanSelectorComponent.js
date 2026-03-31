import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import FullWorkoutPlanModalComponent from './fullWorkoutPlanModal.js'

function WorkoutPlanSelectorComponent() {
    const { getToken } = useAuth();
    const [workoutPlans, setWorkoutPlans] = useState([]);
    const [modal, setModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const toggleModal = () => {
        setModal(!modal);
    }

    const getAllWorkoutPlans = async () => {
        setLoading(true);
        setError(null);
        try {
            const accessToken = await getToken();
            const response = await api.get('/workout-plan', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            setWorkoutPlans(response.data.data.result);
        } catch (err) {
            if (err.response?.status === 404) {
                setWorkoutPlans([]);
            } else {
                setError('Failed to load workout plans');
                console.error('Error fetching plans:', err);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getAllWorkoutPlans()
    }, [])

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading plans...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <p>{error}</p>
                <button onClick={getAllWorkoutPlans}>Retry</button>
            </div>
        );
    }

    return (
        <div className="workout-plan-selector">
            <h1>Select a Workout Plan</h1>
            {workoutPlans.length === 0 ? (
                <p>No workout plans available</p>
            ) : (
                <div className="plans-list">
                    {workoutPlans.map(plan => (
                        <div key={plan.id} className="plan-card">
                            <h3>{plan.name}</h3>
                            <h6>Description:</h6>
                            <p className="plan-description">{plan.description}</p>
                            <h6>Duration:</h6>
                            <p className="plan-duration">{plan.durationWeeks} weeks</p>
                            {plan.SessionTemplates && plan.SessionTemplates.length > 0 && (
                                <div>
                                    <h6 className="plan-split">Split ({plan.SessionTemplates.length}x/week)</h6>
                                    <div>
                                        {plan.SessionTemplates
                                        .sort((a, b) => a.dayOffset - b.dayOffset)
                                        .map(session => {
                                            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                                            const day = days[session.dayOffset % 7]
                                            return (
                                                <p key={session.id} className="plan-sessions">{day}: {session.name}</p>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                            <button onClick={() => {
                                setSelectedPlan(plan)
                                toggleModal()
                            }}>
                                See more
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {modal && selectedPlan && (
                <FullWorkoutPlanModalComponent plan={selectedPlan} onClose={toggleModal} />
            )}
        </div>
    )
}

export default WorkoutPlanSelectorComponent;
