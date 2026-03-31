import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import './global.css';
import StartSessionComponent from './components/startSessionComponent';
import GetSessions2Component from './components/getSessions2Component';
import NavbarComponent from './components/navbarComponent.js'
import ProfileComponent from './components/profileComponent.js'
import SesssionRedirectComponent from './components/sessionRedirectComponent.js';
import HistoryRedirectComponent from './components/historyRedirectComponent.js';
import SessionContent2Component from './components/sessionContent2Component.js';
import WorkoutPlanSelectorComponent from "./components/workoutPlanSelectorComponent.js"
import WorkoutPlanRedirectComponent from './components/workoutPlanRedirectComponent.js'
import WorkoutPlanCreatorComponent from './components/workoutPlanCreatorComponent.js'
import { useSession } from './context/SessionContext';


function App() {
  const { sessionStarted, sessionLogId } = useSession();

  return (
      <Router>
      <NavbarComponent/>
      <div className='main-content'>
        <Routes>
          <Route path="/" element={
            <div>
              <h1 className='main-header'>MyFitnessTracker</h1>
              <div className='main-container'>
                <ProfileComponent/>
                <SesssionRedirectComponent />
                <HistoryRedirectComponent />
              </div>
            </div>
            } />
          <Route path="/new-session" element={
            <div className='form-container'>
              {!sessionStarted && <StartSessionComponent />}
              {sessionStarted && <SessionContent2Component sessionLogId={sessionLogId} /> }
            </div>
          } />
          <Route path="/session-history" element={
            <div className='table-container'>
              <GetSessions2Component />
            </div>
          } />
          <Route path="/workout-plan" element={
            <div className="plan-container">
              <WorkoutPlanRedirectComponent/>
            </div>
          } />
          <Route path="/workout-plan/create-plan" element={
            <WorkoutPlanCreatorComponent />
          } />
          <Route path="/workout-plan/select-plan" element={
            <div>
              <WorkoutPlanSelectorComponent/>
            </div>
          } />
          </Routes>
      </div>
    </Router>
  );
}

export default App;
