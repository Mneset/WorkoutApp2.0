import React, { useState } from 'react';
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


function App() {

  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionLogId, setSessionLogId] = useState(null);

  const handleSessionStarted = (newSessionLogId) => {
    console.log("New sessionLogId:", newSessionLogId);
    setSessionStarted(true)
    setSessionLogId(newSessionLogId)
  };

  const handleSessionEnded = () => {
    setSessionStarted(false)
    setSessionLogId(null)
  }

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
                <SesssionRedirectComponent onSessionStart={handleSessionStarted} />
                <HistoryRedirectComponent />
              </div>
            </div>
            } />
          <Route path="/new-session" element={
            <div className='form-container'>
            {!sessionStarted && <StartSessionComponent onSessionStart={handleSessionStarted}/>}
            {sessionStarted && <SessionContent2Component sessionLogId={sessionLogId} onSessionEnd={handleSessionEnded} /> }
          </div>
          } /> 
          <Route path="/session-history" element={
            <div className='table-container'>
            <GetSessions2Component />
          </div>
          } />
          </Routes>
      </div>
    </Router>   
  );
}

export default App;
