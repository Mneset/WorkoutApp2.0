import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Card from './Card';
import Button from './Button';
import FullSessionModal from './FullSessionModal';

const Eyebrow = ({ children }) => (
  <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">{children}</span>
);

export default function HistoryPage() {
  const { getToken, user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const autoOpenedRef = useRef(false);

  const toggleModal = () => setModal((open) => !open);

  const handleGetSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = await getToken();
      const response = await api.get('/session', {
        params: { userId: user.sub },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = (response.data.data.result || [])
        // History shows finished sessions only; an in-progress one (no end date) is
        // resumed from the dashboard / New Session page, not listed here.
        .filter((s) => s.sessionDateEnd);
      result.sort((a, b) => new Date(b.sessionDateStart || 0) - new Date(a.sessionDateStart || 0));
      setSessions(result);
    } catch (err) {
      setError('Failed to load sessions');
      console.error('Error getting sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionLogId) => {
    try {
      const accessToken = await getToken();
      await api.delete(`/session/${sessionLogId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      handleGetSessions();
    } catch (err) {
      alert('Failed to delete session. Please try again.');
      console.error('Error deleting session:', err);
    }
  };

  useEffect(() => {
    handleGetSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open a specific session's modal when arriving from the dashboard
  useEffect(() => {
    const id = location.state?.openSessionId;
    if (!autoOpenedRef.current && id && sessions.length > 0) {
      const match = sessions.find((s) => s.id === id);
      if (match) {
        setSelectedSession(match);
        setModal(true);
        autoOpenedRef.current = true;
      }
    }
  }, [sessions, location.state]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <Eyebrow>History</Eyebrow>
        <h1 className="mt-2 text-2xl">Session history</h1>
        <p className="mt-1 text-sm text-muted">{sessions.length} sessions logged</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted">Loading sessions…</div>
      ) : error ? (
        <div className="py-16 text-center text-muted">
          <p>{error}</p>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={handleGetSessions}>Retry</Button>
          </div>
        </div>
      ) : sessions && sessions.length > 0 ? (
        <Card className="p-2 sm:p-4">
          {sessions.map((session) => {
            const d = new Date(session.sessionDateStart);

            const distinctNames = [
              ...new Set(
                (session.ExerciseLogs || []).map((log) => log?.Exercise?.name).filter(Boolean)
              ),
            ];
            const summary =
              distinctNames.slice(0, 3).join(', ') +
              (distinctNames.length > 3 ? ` +${distinctNames.length - 3}` : '');

            const totalKg = (session.ExerciseLogs || []).reduce(
              (sum, log) => sum + (log?.weight || 0) * (log?.reps || 0),
              0
            );

            return (
              <div
                key={session.id}
                className="group grid cursor-pointer grid-cols-[44px_1fr_auto] items-center gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-surface-2"
                onClick={() => {
                  setSelectedSession(session);
                  toggleModal();
                }}
              >
                <div className="grid h-11 w-11 flex-shrink-0 place-content-center rounded-[10px] bg-clay-tint text-center">
                  <b className="text-sm leading-none text-clay">{d.getDate()}</b>
                  <span className="mt-0.5 block text-[9px] uppercase tracking-wide text-clay/70">
                    {d.toLocaleDateString('en-GB', { month: 'short' })}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold transition-colors group-hover:text-clay">
                    {session.name || 'Untitled session'}
                  </div>
                  {summary && (
                    <div className="mt-0.5 truncate text-[13px] text-muted">{summary}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {totalKg > 0 && (
                    <span className="text-sm font-bold text-clay">{totalKg.toLocaleString()} kg</span>
                  )}
                  <button
                    className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-clay"
                    title="Edit session"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/new-session', { state: { sessionLogId: session.id, edit: true } });
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </button>
                  <button
                    className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-danger"
                    title="Delete session"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this session?')) {
                        deleteSession(session.id);
                      }
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </Card>
      ) : (
        <div className="py-16 text-center text-muted">
          <p>No sessions found. Start a new session!</p>
        </div>
      )}

      {modal && selectedSession && (
        <FullSessionModal session={selectedSession} onClose={toggleModal} />
      )}
    </div>
  );
}
