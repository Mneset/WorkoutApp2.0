import { useNavigate } from 'react-router-dom';

const HistoryRedirectComponent = () => {
    const navigate = useNavigate();

    const redirectToHistory = () => {
        navigate('/session-history');
    }
    
    return (
        <div className='history-redirect-container'>
            <h2>View session history</h2>
            <button onClick={redirectToHistory}>View Session History</button>
        </div>
    )
}

export default HistoryRedirectComponent;