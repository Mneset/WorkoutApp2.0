import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardPage from './components/DashboardPage';
import NewSessionPage from './components/NewSessionPage';
import HistoryPage from './components/HistoryPage';
import PlansPage from './components/PlansPage';
import CreatePlanPage from './components/CreatePlanPage';
import CreateTemplatePage from './components/CreateTemplatePage';

export default function App() {
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
        </Routes>
      </main>
    </Router>
  );
}
