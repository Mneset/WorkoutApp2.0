import { useNavigate } from 'react-router-dom';

function WorkoutPlanRedirectComponent() {

    const navigate = useNavigate();

    const redirectToPlanSelector = () => {
        navigate('/workout-plan/select-plan');
    }

    const redirectToPlanCreator = () => {
        navigate('/workout-plan/create-plan');
    }

    return (
        <div className="plan-redirect-container-wrapper">
            <h1>Select or create a plan</h1>
            <div className="plan-redirect-container">
                <div className="existing-plan-redirect-container">
                    <h1>Select plan</h1>
                    <button onClick={redirectToPlanSelector}>Select plan</button>
                </div>
                <div className="new-plan-redirect-container">
                    <h1>Create plan</h1>
                    <button onClick={redirectToPlanCreator}>Create a new plan</button>
                </div>
            </div>
        </div>
    

    )
}

export default WorkoutPlanRedirectComponent;