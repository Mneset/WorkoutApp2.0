import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Card from './Card';
import Button from './Button';
import FullPlanModal from './FullPlanModal';

export default function PlansPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);
  const [modal, setModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toggleModal = () => setModal((prev) => !prev);

  const getAllWorkoutPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = await getToken();
      const headers = { Authorization: `Bearer ${accessToken}` };

      const response = await api.get('/workout-plan', { headers });
      setWorkoutPlans(response.data.data.result);

      // Determine the user's active plan (best-effort; mirrors DashboardPage).
      try {
        const u = await api.get('/users', { headers });
        const active = u.data?.data?.result;
        setActivePlanId(active?.WorkoutPlan?.id ?? active?.workoutPlanId ?? null);
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Error fetching active plan:', err);
        }
        setActivePlanId(null);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setWorkoutPlans([]);
      } else {
        setError('Failed to load workout plans');
        console.error('Error fetching plans:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllWorkoutPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Header = (
    <div className="mb-7 flex flex-col items-start justify-between gap-4 sm:flex-row">
      <div>
        <h1 className="text-2xl">Plans</h1>
        <p className="mt-1 text-muted">Pick a plan to follow, or build one from scratch.</p>
      </div>
      <Button onClick={() => navigate('/workout-plan/create-plan')}>Create a plan</Button>
    </div>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-8">
        {Header}
        <div className="py-16 text-center text-muted">Loading plans…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-8">
        {Header}
        <div className="flex flex-col items-center gap-4 py-16 text-center text-muted">
          <p>{error}</p>
          <Button variant="outline" onClick={getAllWorkoutPlans}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-8">
      {Header}

      {workoutPlans.length === 0 ? (
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
      )}

      {modal && selectedPlan && (
        <FullPlanModal
          plan={selectedPlan}
          activePlanId={activePlanId}
          onClose={toggleModal}
          onPlanChange={getAllWorkoutPlans}
        />
      )}
    </div>
  );
}
