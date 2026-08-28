import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Card from './Card';
import Button from './Button';
import ScoreSelect from './ScoreSelect';
import ExercisePickerModal from './ExercisePickerModal';
import { SortableColumn, SortableRow, GripIcon } from './Sortable';
import { parseDuration, formatTimeInput } from '../duration';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

const inputClass =
  'rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm focus:border-clay focus:outline-none focus:ring-[3px] focus:ring-clay-tint';

// RPE: 1–10 in 0.5 steps. RIR: 1–10 in whole steps. Both optional (blank = not set).
const RPE_OPTIONS = Array.from({ length: 19 }, (_, i) => 1 + i * 0.5);
const RIR_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

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
  // Which template + type the exercise picker is open for (null = closed).
  const [picker, setPicker] = useState(null);
  const [coarse, setCoarse] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(pointer: coarse)');
    const onChange = (e) => setCoarse(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

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
        notes: '',
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

  // A blank set row, seeded from `from` (used to copy the previous set's values).
  const blankSet = (isCardio, from = {}) =>
    isCardio
      ? { durationSeconds: from.durationSeconds || '', distance: from.distance || '', rpe: from.rpe || '' }
      : {
          reps: from.reps || '',
          weight: from.weight || '',
          rpe: from.rpe || '',
          rir: from.rir || '',
        };

  // Add an exercise picked from the modal to a template day (starts with one set).
  const addExerciseToTemplate = (templateTempId, exercise) => {
    if (!exercise) return;
    const isCardio = exercise.type === 'cardio';
    setSessionTemplates((prev) =>
      prev.map((s) => {
        if (s.tempId !== templateTempId) return s;
        return {
          ...s,
          exercises: [
            ...s.exercises,
            {
              tempId: Date.now(),
              exerciseId: exercise.id,
              exerciseName: exercise.name,
              type: isCardio ? 'cardio' : 'strength',
              notes: '',
              sets: [blankSet(isCardio)],
            },
          ],
        };
      })
    );
  };

  // Set-level editing within a template exercise.
  const mapExercise = (templateTempId, exerciseTempId, fn) =>
    setSessionTemplates((prev) =>
      prev.map((s) =>
        s.tempId !== templateTempId
          ? s
          : { ...s, exercises: s.exercises.map((e) => (e.tempId === exerciseTempId ? fn(e) : e)) }
      )
    );

  const addSetToExercise = (templateTempId, exerciseTempId) =>
    mapExercise(templateTempId, exerciseTempId, (e) => ({
      ...e,
      sets: [...e.sets, blankSet(e.type === 'cardio', e.sets[e.sets.length - 1] || {})],
    }));

  const removeSetFromExercise = (templateTempId, exerciseTempId, setIndex) =>
    mapExercise(templateTempId, exerciseTempId, (e) =>
      e.sets.length <= 1 ? e : { ...e, sets: e.sets.filter((_, i) => i !== setIndex) }
    );

  const updateSetField = (templateTempId, exerciseTempId, setIndex, field, value) =>
    mapExercise(templateTempId, exerciseTempId, (e) => ({
      ...e,
      sets: e.sets.map((st, i) => (i === setIndex ? { ...st, [field]: value } : st)),
    }));

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

  // Reorder a template exercise; array position becomes its orderIndex on save.
  const moveExerciseInTemplate = (templateTempId, exerciseTempId, direction) => {
    setSessionTemplates((prev) =>
      prev.map((s) => {
        if (s.tempId !== templateTempId) return s;
        const idx = s.exercises.findIndex((e) => e.tempId === exerciseTempId);
        const target = idx + direction;
        if (target < 0 || target >= s.exercises.length) return s;
        const next = [...s.exercises];
        [next[idx], next[target]] = [next[target], next[idx]];
        return { ...s, exercises: next };
      })
    );
  };

  // Reorder a template's exercises to match a dragged order of tempIds (mobile drag).
  const reorderExercisesInTemplate = (templateTempId, orderedTempIds) => {
    setSessionTemplates((prev) =>
      prev.map((s) => {
        if (s.tempId !== templateTempId) return s;
        const byId = Object.fromEntries(s.exercises.map((e) => [e.tempId, e]));
        return { ...s, exercises: orderedTempIds.map((id) => byId[id]).filter(Boolean) };
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
        const isCardio = ex.type === 'cardio';
        if (!ex.sets || ex.sets.length === 0) {
          setError('Every exercise needs at least 1 set');
          return;
        }
        for (const set of ex.sets) {
          if (isCardio) {
            if (!parseDuration(set.durationSeconds) && !(Number(set.distance) > 0)) {
              setError('Every cardio set needs a time or distance');
              return;
            }
          } else if (!(Number(set.reps) >= 1)) {
            setError('Every set needs at least 1 rep');
            return;
          }
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
            notes: st.notes?.trim() || null,
          },
          { headers }
        );

        const sessionTemplate = stResponse.data.data.result;

        // 3. Create exercise templates for each session, with their per-set prescription.
        for (let j = 0; j < st.exercises.length; j++) {
          const ex = st.exercises[j];
          const isCardio = ex.type === 'cardio';
          const sets = ex.sets.map((set) =>
            isCardio
              ? {
                  durationSeconds: parseDuration(set.durationSeconds),
                  distance: numOrNull(set.distance),
                  rpe: numOrNull(set.rpe),
                }
              : {
                  reps: Number(set.reps),
                  weight: Number(set.weight) || null,
                  rpe: numOrNull(set.rpe),
                  rir: numOrNull(set.rir),
                }
          );
          // Representative base_* values (from set 1) keep legacy consumers/fallbacks sane.
          const first = sets[0] || {};
          await api.post(
            '/exercise-template',
            {
              sessionTemplateId: sessionTemplate.id,
              exerciseId: Number(ex.exerciseId),
              orderIndex: j,
              baseSets: sets.length,
              baseRpe: first.rpe ?? null,
              sets,
              notes: ex.notes?.trim() || null,
              ...(isCardio
                ? {
                    baseDurationSeconds: first.durationSeconds ?? null,
                    baseDistance: first.distance ?? null,
                  }
                : {
                    baseReps: first.reps ?? null,
                    baseWeight: first.weight ?? null,
                    baseRir: first.rir ?? null,
                  }),
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
                className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg border border-line-strong text-ink transition-colors hover:border-danger hover:bg-danger/10 hover:text-danger"
                onClick={() => removeSessionTemplate(st.tempId)}
                aria-label="Remove session"
              >
                ✕
              </button>
            </div>
          </div>

          <textarea
            rows={2}
            className={`${inputClass} mb-3 w-full resize-y`}
            placeholder="Session notes (optional) — e.g. focus, warm-up, general cues"
            value={st.notes}
            onChange={(e) => updateSessionTemplate(st.tempId, 'notes', e.target.value)}
          />

          <SortableColumn
            items={st.exercises.map((e) => e.tempId)}
            onReorder={(order) => reorderExercisesInTemplate(st.tempId, order)}
          >
          {st.exercises.map((ex, idx) => {
            const isCardio = ex.type === 'cardio';
            const exName =
              ex.exerciseName ||
              exercises.find((x) => x.id === Number(ex.exerciseId))?.name ||
              'Exercise';
            const gridCols = isCardio
              ? 'grid-cols-[28px_1fr_1fr_1fr_28px]'
              : 'grid-cols-[28px_1fr_1fr_1fr_1fr_28px]';
            return (
            <SortableRow key={ex.tempId} id={ex.tempId}>
              {({ setNodeRef, style, handleProps, isDragging, isSorting }) => (
            <div
              ref={setNodeRef}
              style={style}
              className={`mb-2 rounded-lg border px-3.5 py-3 ${isDragging ? 'border-clay shadow-lg' : 'border-line'}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-4 shrink-0 font-semibold text-clay">{idx + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{exName}</div>
                  {isCardio && (
                    <span className="mt-0.5 inline-block rounded-full bg-clay-tint px-2 py-0.5 text-[10px] font-semibold text-clay">
                      Cardio
                    </span>
                  )}
                </div>
                {coarse ? (
                  <button
                    type="button"
                    aria-label="Hold and drag to reorder"
                    className="grid h-8 w-8 flex-shrink-0 cursor-grab touch-none select-none place-items-center rounded-lg border border-line-strong text-ink active:cursor-grabbing active:bg-clay-tint active:text-clay"
                    {...handleProps}
                  >
                    <GripIcon />
                  </button>
                ) : (
                  <div className="flex flex-shrink-0 items-center overflow-hidden rounded-lg border border-line-strong">
                    <button
                      type="button"
                      title="Move up"
                      disabled={idx === 0}
                      onClick={() => moveExerciseInTemplate(st.tempId, ex.tempId, -1)}
                      className="grid h-8 w-8 place-items-center text-ink transition-colors hover:bg-clay-tint hover:text-clay disabled:pointer-events-none disabled:opacity-25"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6" /></svg>
                    </button>
                    <div className="h-8 w-px bg-line" />
                    <button
                      type="button"
                      title="Move down"
                      disabled={idx === st.exercises.length - 1}
                      onClick={() => moveExerciseInTemplate(st.tempId, ex.tempId, 1)}
                      className="grid h-8 w-8 place-items-center text-ink transition-colors hover:bg-clay-tint hover:text-clay disabled:pointer-events-none disabled:opacity-25"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  title="Remove exercise"
                  onClick={() => removeExerciseFromTemplate(st.tempId, ex.tempId)}
                  aria-label="Remove exercise"
                  className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg border border-line-strong text-ink transition-colors hover:border-danger hover:bg-danger/10 hover:text-danger"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6M14 11v6" /></svg>
                </button>
              </div>

              {!isSorting && (
              <div className="mt-3">
                {/* Column headers */}
                <div className={`grid ${gridCols} items-center gap-1.5 border-b border-line pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted`}>
                  <span>Set</span>
                  <span className="text-center">{isCardio ? 'Time' : 'Reps'}</span>
                  <span className="text-center">{isCardio ? 'Km' : 'Kg'}</span>
                  <span className="text-center">RPE</span>
                  {!isCardio && <span className="text-center">RIR</span>}
                  <span />
                </div>

                {/* One row per prescribed set */}
                {ex.sets.map((set, sIdx) => (
                  <div
                    key={sIdx}
                    className={`grid ${gridCols} items-center gap-1.5 py-1.5 ${
                      sIdx > 0 ? 'border-t border-line' : ''
                    }`}
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-clay-tint text-xs font-bold text-clay">
                      {sIdx + 1}
                    </span>
                    {isCardio ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="mm:ss"
                        className={`${inputClass} w-full px-1.5 text-center`}
                        value={set.durationSeconds}
                        onChange={(e) =>
                          updateSetField(st.tempId, ex.tempId, sIdx, 'durationSeconds', formatTimeInput(e.target.value))
                        }
                      />
                    ) : (
                      <input
                        type="number"
                        min="0"
                        placeholder="–"
                        className={`${inputClass} w-full px-1.5 text-center`}
                        value={set.reps}
                        onChange={(e) => {
                          if (Number(e.target.value) < 0) return;
                          updateSetField(st.tempId, ex.tempId, sIdx, 'reps', e.target.value);
                        }}
                      />
                    )}
                    {isCardio ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="–"
                        className={`${inputClass} w-full px-1.5 text-center`}
                        value={set.distance}
                        onChange={(e) => {
                          if (Number(e.target.value) < 0) return;
                          updateSetField(st.tempId, ex.tempId, sIdx, 'distance', e.target.value);
                        }}
                      />
                    ) : (
                      <input
                        type="number"
                        min="0"
                        placeholder="–"
                        className={`${inputClass} w-full px-1.5 text-center`}
                        value={set.weight}
                        onChange={(e) => {
                          if (Number(e.target.value) < 0) return;
                          updateSetField(st.tempId, ex.tempId, sIdx, 'weight', e.target.value);
                        }}
                      />
                    )}
                    <ScoreSelect
                      value={set.rpe}
                      options={RPE_OPTIONS}
                      onChange={(v) => updateSetField(st.tempId, ex.tempId, sIdx, 'rpe', v)}
                    />
                    {!isCardio && (
                      <ScoreSelect
                        value={set.rir}
                        options={RIR_OPTIONS}
                        onChange={(v) => updateSetField(st.tempId, ex.tempId, sIdx, 'rir', v)}
                      />
                    )}
                    <button
                      type="button"
                      title="Remove set"
                      disabled={ex.sets.length <= 1}
                      onClick={() => removeSetFromExercise(st.tempId, ex.tempId, sIdx)}
                      className="grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:pointer-events-none disabled:opacity-25"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addSetToExercise(st.tempId, ex.tempId)}
                  className="mt-2 w-full rounded-lg border border-dashed border-line-strong py-2 text-xs font-semibold text-clay hover:border-clay hover:bg-clay-tint"
                >
                  + Add set
                </button>

                <input
                  type="text"
                  className={`${inputClass} mt-2 w-full`}
                  placeholder="Exercise notes (optional) — e.g. tempo, form cues"
                  value={ex.notes}
                  onChange={(e) =>
                    mapExercise(st.tempId, ex.tempId, (en) => ({ ...en, notes: e.target.value }))
                  }
                />
              </div>
              )}
            </div>
              )}
            </SortableRow>
            );
          })}
          </SortableColumn>

          <div className="flex flex-col gap-2">
            <button
              className="w-full rounded-lg border border-dashed border-line-strong py-3 text-sm font-semibold text-clay hover:border-clay hover:bg-clay-tint"
              onClick={() => setPicker({ templateTempId: st.tempId, type: 'strength' })}
            >
              + Add exercise
            </button>
            <button
              className="w-full rounded-lg border border-dashed border-line-strong py-3 text-sm font-semibold text-clay hover:border-clay hover:bg-clay-tint"
              onClick={() => setPicker({ templateTempId: st.tempId, type: 'cardio' })}
            >
              + Add cardio
            </button>
          </div>
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

      {picker && (
        <ExercisePickerModal
          exercises={exercises}
          type={picker.type}
          onSelect={(ex) => addExerciseToTemplate(picker.templateTempId, ex)}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
