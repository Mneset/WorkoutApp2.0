import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import api from '../api';
import Card from './Card';
import Button from './Button';
import FullPlanModal from './FullPlanModal';
import FullTemplateModal from './FullTemplateModal';

export default function PlansPage() {
  const { getToken, user } = useAuth();
  const { handleSessionStarted } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  const [view, setView] = useState(
    () => (new URLSearchParams(location.search).get('view') === 'templates' ? 'templates' : 'plans')
  );

  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);
  const [modal, setModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);

  const toggleModal = () => setModal((prev) => !prev);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = await getToken();
      const headers = { Authorization: `Bearer ${accessToken}` };

      const [plansRes, templatesRes] = await Promise.allSettled([
        api.get('/workout-plan', { headers }),
        api.get('/session-template/standalone', { params: { userId: user.sub }, headers }),
      ]);

      if (plansRes.status === 'fulfilled') {
        setWorkoutPlans(plansRes.value.data.data.result || []);
      } else if (plansRes.reason?.response?.status === 404) {
        setWorkoutPlans([]);
      } else {
        console.error('Error fetching plans:', plansRes.reason);
        setError('Failed to load workout plans');
      }

      setTemplates(
        templatesRes.status === 'fulfilled' ? templatesRes.value.data.data.result || [] : []
      );

      // Determine the user's active plan (best-effort; mirrors DashboardPage).
      try {
        const u = await api.get('/users', { headers });
        const active = u.data?.data?.result;
        setActivePlanId(active?.WorkoutPlan?.id ?? active?.workoutPlanId ?? null);
      } catch (err) {
        if (err.response?.status !== 404) console.error('Error fetching active plan:', err);
        setActivePlanId(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start a workout from a standalone template. If a session is already in progress,
  // send the user to it rather than silently creating a second one.
  const startFromTemplate = async (templateId) => {
    setStarting(true);
    try {
      const accessToken = await getToken();
      const headers = { Authorization: `Bearer ${accessToken}` };
      const existing = await api.get('/session', { params: { userId: user.sub }, headers });
      const inProgress = (existing.data.data.result || []).find((s) => !s.sessionDateEnd);
      if (inProgress) {
        const hasWork = (inProgress.ExerciseLogs || []).length > 0;
        if (hasWork) {
          // A real in-progress workout — don't clobber it.
          const go = window.confirm(
            'You have a session in progress with logged sets. Open it to finish or discard it first?'
          );
          if (go) {
            handleSessionStarted(inProgress.id);
            navigate('/new-session');
          }
          return;
        }
        // An empty, abandoned session (e.g. one New Session created and left) — just
        // discard it and start the template.
        await api.delete(`/session/${inProgress.id}`, { headers });
      }
      const res = await api.post(
        '/session',
        { userId: user.sub, sessionTemplateId: templateId },
        { headers }
      );
      handleSessionStarted(res.data.data.result.sessionLogId);
      navigate('/new-session');
    } catch (err) {
      console.error('Error starting from template:', err);
      alert('Failed to start workout. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  const deleteTemplate = async (templateId) => {
    if (!window.confirm('Delete this template? This cannot be undone.')) return;
    try {
      const accessToken = await getToken();
      await api.delete(`/session-template/${templateId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      setSelectedTemplate(null);
    } catch (err) {
      console.error('Error deleting template:', err);
      alert('Failed to delete template.');
    }
  };

  const Toggle = (
    <div className="inline-flex rounded-xl border border-line-strong bg-surface-2 p-1">
      {['plans', 'templates'].map((v) => (
        <button
          key={v}
          onClick={() => setView(v)}
          className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
            view === v ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );

  const Header = (
    <div className="mb-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl">{view === 'plans' ? 'Plans' : 'Templates'}</h1>
        <p className="mt-1 text-muted">
          {view === 'plans'
            ? 'Pick a plan to follow, or build one from scratch.'
            : 'Reusable sessions you can start any time.'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {Toggle}
        {view === 'plans' ? (
          <Button onClick={() => navigate('/workout-plan/create-plan')}>Create a plan</Button>
        ) : (
          <Button onClick={() => navigate('/workout-plan/create-template')}>New template</Button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-8">
        {Header}
        <div className="py-16 text-center text-muted">Loading…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-8">
      {Header}

      {error && view === 'plans' && (
        <div className="mb-4 flex items-center gap-4 text-muted">
          <p>{error}</p>
          <Button variant="outline" onClick={loadAll}>
            Retry
          </Button>
        </div>
      )}

      {view === 'plans' ? (
        workoutPlans.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center text-muted">
            <p>No workout plans yet.</p>
            <div
              onClick={() => navigate('/workout-plan/create-plan')}
              className="grid min-h-[120px] w-full max-w-sm cursor-pointer place-items-center rounded-2xl border border-dashed border-line-strong text-sm font-semibold text-clay hover:border-clay hover:bg-clay-tint"
            >
              + New plan
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {workoutPlans.map((plan) => {
              const sessionCount = plan.SessionTemplates ? plan.SessionTemplates.length : 0;
              const isActive = activePlanId != null && plan.id === activePlanId;
              return (
                <Card
                  key={plan.id}
                  className="cursor-pointer p-5"
                  onClick={() => {
                    setSelectedPlan(plan);
                    toggleModal();
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-[650]">{plan.name}</div>
                      <div className="mt-1 font-mono text-xs text-muted">
                        {sessionCount} sessions · {plan.durationWeeks} weeks
                      </div>
                    </div>
                    {isActive ? (
                      <span className="rounded-full bg-clay-tint px-2.5 py-1 text-xs font-semibold text-clay">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#efece5] px-2.5 py-1 text-xs font-semibold text-muted">
                        Saved
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-muted">{plan.description}</p>
                </Card>
              );
            })}
            <div
              onClick={() => navigate('/workout-plan/create-plan')}
              className="grid min-h-[120px] cursor-pointer place-items-center rounded-2xl border border-dashed border-line-strong text-sm font-semibold text-clay hover:border-clay hover:bg-clay-tint"
            >
              + New plan
            </div>
          </div>
        )
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center text-muted">
          <p>No templates yet.</p>
          <div
            onClick={() => navigate('/workout-plan/create-template')}
            className="grid min-h-[120px] w-full max-w-sm cursor-pointer place-items-center rounded-2xl border border-dashed border-line-strong text-sm font-semibold text-clay hover:border-clay hover:bg-clay-tint"
          >
            + New template
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {templates.map((tpl) => {
            const exCount = tpl.ExerciseTemplates ? tpl.ExerciseTemplates.length : 0;
            return (
              <Card
                key={tpl.id}
                className="flex cursor-pointer flex-col p-5"
                onClick={() => setSelectedTemplate(tpl)}
              >
                <div className="min-w-0">
                  <div className="truncate font-[650]">{tpl.name}</div>
                  <div className="mt-1 font-mono text-xs text-muted">
                    {exCount} {exCount === 1 ? 'exercise' : 'exercises'}
                  </div>
                </div>
                {tpl.ExerciseTemplates && tpl.ExerciseTemplates.length > 0 && (
                  <ul className="mt-3 space-y-0.5 text-sm text-muted">
                    {tpl.ExerciseTemplates.slice(0, 4).map((ex) => (
                      <li key={ex.id} className="truncate">
                        {ex.Exercise?.name || 'Exercise'}
                      </li>
                    ))}
                    {tpl.ExerciseTemplates.length > 4 && (
                      <li className="text-xs">+{tpl.ExerciseTemplates.length - 4} more</li>
                    )}
                  </ul>
                )}
                <div className="mt-4 pt-1">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      startFromTemplate(tpl.id);
                    }}
                    disabled={starting}
                  >
                    {starting ? 'Starting…' : 'Start workout'}
                  </Button>
                </div>
              </Card>
            );
          })}
          <div
            onClick={() => navigate('/workout-plan/create-template')}
            className="grid min-h-[120px] cursor-pointer place-items-center rounded-2xl border border-dashed border-line-strong text-sm font-semibold text-clay hover:border-clay hover:bg-clay-tint"
          >
            + New template
          </div>
        </div>
      )}

      {modal && selectedPlan && (
        <FullPlanModal
          plan={selectedPlan}
          activePlanId={activePlanId}
          onClose={toggleModal}
          onPlanChange={loadAll}
        />
      )}

      {selectedTemplate && (
        <FullTemplateModal
          template={selectedTemplate}
          starting={starting}
          onClose={() => setSelectedTemplate(null)}
          onStart={startFromTemplate}
          onDelete={deleteTemplate}
        />
      )}
    </div>
  );
}
