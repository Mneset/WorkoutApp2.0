import { useAuth0 } from "@auth0/auth0-react";
import React, { useState, useEffect } from 'react';
import api from '../api';
import FullWorkoutPlanModalComponent from './fullWorkoutPlanModal.js'

function WorkoutPlanSelectorComponent() {
    const { getAccessTokenSilently } = useAuth0();
    const [workoutPlans, setWorkoutPlans] = useState([]);
    const [modal, setModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    
    const toggleModal = () => {
        setModal(!modal);
    }

    const getAllWorkoutPlans = async () => {
        const accessToken = await getAccessTokenSilently({
            authorizationParams: {
                audience: 'https://dev-n8xnfzfw0w26p6nq.us.auth0.com/api/v2/',
                scope: "openid start:session",
            },
        }); 

        const response = await api.get('/workout-plan',  {
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
        });
        
        setWorkoutPlans(response.data.data.result);
    }

    useEffect(() => {
        getAllWorkoutPlans()
    }, [])

    return (
        <div className="workout-plan-selector">
            <h1>Select a Workout Plan</h1>
            <div className="worokoutt-plan-selector">
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
                                        <div >
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
        </div>
    )
}

export default WorkoutPlanSelectorComponent;