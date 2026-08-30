import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import DashboardPage from './components/DashboardPage';
import NewSessionPage from './components/NewSessionPage';
import HistoryPage from './components/HistoryPage';
import PlansPage from './components/PlansPage';
import CreatePlanPage from './components/CreatePlanPage';
import CreateTemplatePage from './components/CreateTemplatePage';
import OneRepMaxPage from './components/OneRepMaxPage';
import LandingPage from './components/LandingPage';
import AddToHomeScreenPrompt from './components/AddToHomeScreenPrompt';

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  // While Auth0 restores the session, show a neutral splash so we don't flash the
  // landing page for an already-signed-in user.
  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-surface text-sm text-muted">
        Loading…
      </div>
    );
  }

  // Signed out: no navbar, just the login landing page.
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <Router>
      <Navbar />
      <main className="pb-24 md:pb-0">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/new-session" element={<NewSessionPage />} />
          <Route path="/session-history" element={<HistoryPage />} />
          <Route path="/workout-plan" element={<PlansPage />} />
          <Route path="/workout-plan/create-plan" element={<CreatePlanPage />} />
          <Route path="/workout-plan/create-template" element={<CreateTemplatePage />} />
          <Route path="/one-rep-max" element={<OneRepMaxPage />} />
        </Routes>
      </main>
      <AddToHomeScreenPrompt />
    </Router>
  );
}
