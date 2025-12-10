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
        <div>
            <div className="existing-plan-redirect-container">
                <h1>Select plan</h1>
                <button onClick={redirectToPlanSelector}>Select plan</button>
            </div>
            <div className="new-plan-redirect-container">
                <h1>Create plan</h1>
                <button onClick={redirectToPlanCreator}>Create a new plan</button>
            </div>
        </div>
    

    )
}

export default WorkoutPlanRedirectComponent;