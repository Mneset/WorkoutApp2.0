import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Card from './Card';
import Button from './Button';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

const inputClass =
  'rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm focus:border-clay focus:outline-none focus:ring-[3px] focus:ring-clay-tint';

const Eyebrow = ({ children }) => (
  <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">{children}</span>
);

export default function CreatePlanPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [sessionTemplates, setSessionTemplates] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const accessToken = await getToken();
        const response = await api.get('/exercise-log', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setExercises(response.data.data.result);
      } catch (err) {
        setError('Failed to load exercises');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, [getToken]);

  const addSessionTemplate = () => {
    setSessionTemplates((prev) => [
      ...prev,
      {
        tempId: Date.now(),
        name: '',
        dayOffset: prev.length,
        exercises: [],
      },
    ]);
  };

  const removeSessionTemplate = (tempId) => {
    setSessionTemplates((prev) => prev.filter((s) => s.tempId !== tempId));
  };

  const updateSessionTemplate = (tempId, field, value) => {
    setSessionTemplates((prev) =>
      prev.map((s) => (s.tempId === tempId ? { ...s, [field]: value } : s))
    );
  };

  const addExerciseToTemplate = (templateTempId) => {
    setSessionTemplates((prev) =>
      prev.map((s) => {
        if (s.tempId !== templateTempId) return s;
        return {
          ...s,
          exercises: [
            ...s.exercises,
            {
              tempId: Date.now(),
              exerciseId: exercises.length > 0 ? exercises[0].id : '',
              baseSets: '',
              baseReps: '',
              baseWeight: '',
              baseRpe: '',
              baseRir: '',
            },
          ],
        };
      })
    );
  };

  const removeExerciseFromTemplate = (templateTempId, exerciseTempId) => {
    setSessionTemplates((prev) =>
      prev.map((s) => {
        if (s.tempId !== templateTempId) return s;
        return {
          ...s,
          exercises: s.exercises.filter((e) => e.tempId !== exerciseTempId),
        };
      })
    );
  };

  const updateExerciseInTemplate = (templateTempId, exerciseTempId, field, value) => {
    setSessionTemplates((prev) =>
      prev.map((s) => {
        if (s.tempId !== templateTempId) return s;
        return {
          ...s,
          exercises: s.exercises.map((e) =>
            e.tempId === exerciseTempId ? { ...e, [field]: value } : e
          ),
        };
      })
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Plan name is required');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (sessionTemplates.length === 0) {
      setError('Add at least one session');
      return;
    }
    for (const st of sessionTemplates) {
      if (!st.name.trim()) {
        setError('All sessions need a name');
        return;
      }
      for (const ex of st.exercises) {
        if (!(Number(ex.baseSets) >= 1) || !(Number(ex.baseReps) >= 1)) {
          setError('Every exercise needs sets and reps (at least 1)');
          return;
        }
      }
    }

    setSaving(true);
    setError(null);

    try {
      const accessToken = await getToken();
      const headers = { Authorization: `Bearer ${accessToken}` };

      // 1. Create the workout plan
      const planResponse = await api.post(
        '/workout-plan',
        {
          name: name.trim(),
          description: description.trim(),
          durationWeeks: Number(durationWeeks),
        },
        { headers }
      );

      const plan = planResponse.data.data.result;

      // 2. Create session templates
      for (let i = 0; i < sessionTemplates.length; i++) {
        const st = sessionTemplates[i];
        const stResponse = await api.post(
          '/session-template',
          {
            name: st.name.trim(),
            dayOffset: Number(st.dayOffset),
            workoutPlanId: plan.id,
          },
          { headers }
        );

        const sessionTemplate = stResponse.data.data.result;

        // 3. Create exercise templates for each session
        for (let j = 0; j < st.exercises.length; j++) {
          const ex = st.exercises[j];
          await api.post(
            '/exercise-template',
            {
              sessionTemplateId: sessionTemplate.id,
              exerciseId: Number(ex.exerciseId),
              orderIndex: j,
              baseSets: Number(ex.baseSets),
              baseReps: Number(ex.baseReps),
              baseWeight: Number(ex.baseWeight) || null,
              baseRpe: numOrNull(ex.baseRpe),
              baseRir: numOrNull(ex.baseRir),
            },
            { headers }
          );
        }
      }

      navigate('/workout-plan');
    } catch (err) {
      const msg = err.response?.data?.data?.message || 'Failed to create plan';
      setError(msg);
      console.error('Error creating plan:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="py-16 text-center text-sm text-muted">Loading…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <span
        onClick={() => navigate('/workout-plan')}
        className="cursor-pointer text-[13px] font-semibold text-clay hover:text-clay-hover"
      >
        ← Plans
      </span>
      <h1 className="mt-1 text-2xl">Create a plan</h1>

      {/* Details */}
      <Card className="mt-6 p-6">
        <div className="flex flex-col gap-5">
          <div>
            <Eyebrow>Plan name</Eyebrow>
            <input
              type="text"
              className={`${inputClass} mt-1.5 w-full`}
              placeholder="e.g. Push Pull Legs"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Eyebrow>Description</Eyebrow>
            <input
              type="text"
              className={`${inputClass} mt-1.5 w-full`}
              placeholder="A short summary of this plan"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Eyebrow>Duration (weeks)</Eyebrow>
            <input
              type="number"
              min="1"
              className={`${inputClass} mt-1.5 w-[140px]`}
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Sessions */}
      <div className="mt-7 mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-[650]">Sessions</h2>
        <Eyebrow>Repeats weekly</Eyebrow>
      </div>

      {sessionTemplates.map((st) => (
        <Card key={st.tempId} className="mb-4 p-5">
          <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <input
              type="text"
              className={`${inputClass} w-full min-w-0 sm:flex-1`}
              placeholder="Session name (e.g. Push Day)"
              value={st.name}
              onChange={(e) => updateSessionTemplate(st.tempId, 'name', e.target.value)}
            />
            <div className="flex items-center gap-2.5">
              <select
                className={`${inputClass} w-full sm:w-[150px]`}
                value={st.dayOffset}
                onChange={(e) => updateSessionTemplate(st.tempId, 'dayOffset', Number(e.target.value))}
              >
                {DAYS.map((day, i) => (
                  <option key={i} value={i}>
                    {day}
                  </option>
                ))}
              </select>
              <button
                className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-danger"
                onClick={() => removeSessionTemplate(st.tempId)}
                aria-label="Remove session"
              >
                ✕
              </button>
            </div>
          </div>

          {st.exercises.map((ex, idx) => (
            <div key={ex.tempId} className="mb-2 rounded-lg border border-line px-3.5 py-3">
              <div className="flex items-center gap-3">
                <span className="w-4 shrink-0 font-semibold text-clay">{idx + 1}</span>
                <select
                  className={`${inputClass} min-w-0 flex-1`}
                  value={ex.exerciseId}
                  onChange={(e) =>
                    updateExerciseInTemplate(st.tempId, ex.tempId, 'exerciseId', e.target.value)
                  }
                >
                  {exercises.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </option>
                  ))}
                </select>
                <button
                  className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-danger"
                  onClick={() => removeExerciseFromTemplate(st.tempId, ex.tempId)}
                  aria-label="Remove exercise"
                >
                  ✕
                </button>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2 pl-7 sm:grid-cols-5">
                {[
                  { key: 'baseSets', label: 'Sets', min: '1' },
                  { key: 'baseReps', label: 'Reps', min: '1' },
                  { key: 'baseWeight', label: 'Weight', min: '0' },
                  { key: 'baseRpe', label: 'RPE', min: '0', max: '10', step: '0.5' },
                  { key: 'baseRir', label: 'RIR', min: '0' },
                ].map((f) => (
                  <label key={f.key} className="block">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted">
                      {f.label}
                    </span>
                    <input
                      type="number"
                      min={f.min}
                      max={f.max}
                      step={f.step}
                      placeholder="–"
                      className={`${inputClass} w-full text-center`}
                      value={ex[f.key]}
                      onChange={(e) => {
                        if (Number(e.target.value) < 0) return;
                        updateExerciseInTemplate(st.tempId, ex.tempId, f.key, e.target.value);
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            className="w-full rounded-lg border border-dashed border-line-strong py-3 text-sm font-semibold text-clay hover:border-clay hover:bg-clay-tint"
            onClick={() => addExerciseToTemplate(st.tempId)}
          >
            + Add exercise
          </button>
        </Card>
      ))}

      <button
        className="w-full rounded-lg border border-dashed border-line-strong py-3 text-sm font-semibold text-clay hover:border-clay hover:bg-clay-tint"
        onClick={addSessionTemplate}
      >
        + Add session day
      </button>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-6 flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={() => navigate('/workout-plan')}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Creating plan…' : 'Create plan'}
        </Button>
      </div>
    </div>
  );
}
