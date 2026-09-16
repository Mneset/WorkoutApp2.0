import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../context/UserContext';
import api from '../api';
import Card from './Card';
import Button from './Button';
import ScoreSelect from './ScoreSelect';
import ExercisePickerModal from './ExercisePickerModal';
import { SortableColumn, SortableRow, GripIcon } from './Sortable';
import ExerciseFieldSettings, { FieldSettingsButton, fieldOn } from './ExerciseFieldSettings';
import { parseDuration, formatDuration, formatTimeInput } from '../duration';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

const inputClass =
  'rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm focus:border-clay focus:outline-none focus:ring-[3px] focus:ring-clay-tint';

// The set-table inputs need their own class rather than `inputClass` plus an override:
// both would emit a px-* utility of equal specificity, so which one won came down to
// stylesheet order and `px-3` was winning. `min-w-0` lets the grid track shrink below the
// input's intrinsic width instead of overflowing.
const numInputClass =
  'w-full min-w-0 rounded-lg border border-line-strong bg-surface px-1.5 py-2.5 text-center text-sm focus:border-clay focus:outline-none focus:ring-[3px] focus:ring-clay-tint sm:px-2';

// RPE: 1–10 in 0.5 steps. RIR: 1–10 in whole steps. Both optional (blank = not set).
const RPE_OPTIONS = Array.from({ length: 19 }, (_, i) => 1 + i * 0.5);
const RIR_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

const Eyebrow = ({ children }) => (
  <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">{children}</span>
);

export default function CreatePlanPage() {
  const { getToken } = useAuth();
  const { profile } = useUserProfile();
  const prefs = profile?.preferences || null;
  // The Metric modes master gates the Weight/Time/1RM% toggle. Which optional columns show
  // is now per exercise (see `exCfg` in the exercise loop), with the profile prefs as the
  // starting point for a newly added one.
  const metricsOn = prefs?.metricsEnabled !== false;
  // Which exercise's field-settings panel is open (by tempId).
  const [settingsFor, setSettingsFor] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeId } = useParams();
  // Edit mode: the id comes from the URL (so it survives a reload). The full nested
  // plan rides along via nav state as a fast path; on a hard refresh we fetch it.
  const editId = routeId ? Number(routeId) : null;
  const [editPlan, setEditPlan] = useState(location.state?.editPlan || null);

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

  // Phone-width layout: the set table trades padding for input width below this.
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(max-width: 639px)').matches
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(pointer: coarse)');
    const mqNarrow = window.matchMedia('(max-width: 639px)');
    const onChange = (e) => setCoarse(e.matches);
    const onNarrow = (e) => setNarrow(e.matches);
    mq.addEventListener?.('change', onChange);
    mqNarrow.addEventListener?.('change', onNarrow);
    return () => {
      mq.removeEventListener?.('change', onChange);
      mqNarrow.removeEventListener?.('change', onNarrow);
    };
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

  // On a hard reload the nav state is gone — fetch the plan by its URL id.
  useEffect(() => {
    if (!editId || editPlan) return;
    (async () => {
      try {
        const accessToken = await getToken();
        const res = await api.get('/workout-plan', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const found = (res.data?.data?.result || []).find((p) => p.id === editId);
        if (found) setEditPlan(found);
        else setError('Plan not found');
      } catch (err) {
        setError('Failed to load plan');
        console.error(err);
      }
    })();
  }, [editId, editPlan, getToken]);

  // Populate the builder from the plan being edited (once it's available).
  const populated = useRef(false);
  useEffect(() => {
    if (!editPlan || populated.current) return;
    populated.current = true;
    setName(editPlan.name || '');
    setDescription(editPlan.description || '');
    setDurationWeeks(editPlan.durationWeeks || 4);
    let idc = Date.now();
    const uid = () => idc++;
    const days = [...(editPlan.SessionTemplates || [])]
      .sort((a, b) => (a.dayOffset ?? 0) - (b.dayOffset ?? 0))
      .map((st) => ({
        tempId: uid(),
        name: st.name || '',
        dayOffset: st.dayOffset ?? 0,
        notes: st.notes || '',
        exercises: [...(st.ExerciseTemplates || [])]
          .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
          .map((et) => {
            const isCardio = et.Exercise?.type === 'cardio';
            const isTimed = !isCardio && !!et.isTimed;
            const sets = Array.isArray(et.sets) && et.sets.length ? et.sets : [{}];
            return {
              tempId: uid(),
              exerciseId: et.exerciseId,
              exerciseName: et.Exercise?.name,
              type: isCardio ? 'cardio' : 'strength',
              notes: et.notes || '',
              weightUnit: et.weightUnit || 'kg',
              // Null on plans saved before field_config existed; falls back to the profile.
              fieldConfig: et.fieldConfig || null,
              isTimed,
              sets: sets.map((s) =>
                isCardio || isTimed
                  ? {
                      durationSeconds: s.durationSeconds ? formatDuration(s.durationSeconds) : '',
                      distance: s.distance ?? '',
                      rpe: s.rpe ?? null,
                      notes: s.notes ?? '',
                    }
                  : {
                      reps: s.reps ?? '',
                      weight: s.weight ?? '',
                      rpe: s.rpe ?? null,
                      rir: s.rir ?? null,
                      notes: s.notes ?? '',
                    }
              ),
            };
          }),
      }));
    setSessionTemplates(days);
  }, [editPlan]);

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
  // A new set starts with an empty note rather than copying the previous set's: a note is
  // usually specific to the set it was written on.
  const blankSet = (isCardio, from = {}) =>
    isCardio
      ? { durationSeconds: from.durationSeconds || '', distance: from.distance || '', rpe: from.rpe || '', notes: '' }
      : {
          reps: from.reps || '',
          weight: from.weight || '',
          durationSeconds: from.durationSeconds || '',
          rpe: from.rpe || '',
          rir: from.rir || '',
          notes: '',
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
              weightUnit: 'kg',
              // Starts from the profile defaults; the gear button overrides it per exercise.
              fieldConfig: {
                showRpe: prefs?.showRpe !== false,
                showRir: prefs?.showRir !== false,
                showSetNotes: prefs?.showNotes !== false,
                showExerciseNotes: prefs?.showNotes !== false,
              },
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

  // Switch an exercise's weight unit (kg ↔ % of 1RM).
  const setExerciseWeightUnit = (templateTempId, exerciseTempId, unit) =>
    setSessionTemplates((prev) =>
      prev.map((s) =>
        s.tempId !== templateTempId
          ? s
          : {
              ...s,
              exercises: s.exercises.map((e) =>
                e.tempId === exerciseTempId ? { ...e, weightUnit: unit } : e
              ),
            }
      )
    );

  // Switch an exercise between reps/weight and time-based (hold) prescription.
  const setExerciseTimed = (templateTempId, exerciseTempId, timed) =>
    setSessionTemplates((prev) =>
      prev.map((s) =>
        s.tempId !== templateTempId
          ? s
          : {
              ...s,
              exercises: s.exercises.map((e) =>
                e.tempId === exerciseTempId ? { ...e, isTimed: timed } : e
              ),
            }
      )
    );

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
        // Prescribed values are placeholders now (they can be blank or a range like
        // "8-12"), so a set only needs to exist — no minimum reps/time required.
        if (!ex.sets || ex.sets.length === 0) {
          setError('Every exercise needs at least 1 set');
          return;
        }
      }
    }

    setSaving(true);
    setError(null);

    try {
      const accessToken = await getToken();
      const headers = { Authorization: `Bearer ${accessToken}` };

      // 1. Create the plan, or update it and clear its old days for replacement.
      let planId;
      if (editId) {
        await api.put(
          `/workout-plan/${editId}`,
          {
            name: name.trim(),
            description: description.trim(),
            durationWeeks: Number(durationWeeks),
          },
          { headers }
        );
        // Delete existing day templates (cascades their exercise templates).
        for (const st of editPlan?.SessionTemplates || []) {
          await api.delete(`/session-template/${st.id}`, { headers });
        }
        planId = editId;
      } else {
        const planResponse = await api.post(
          '/workout-plan',
          {
            name: name.trim(),
            description: description.trim(),
            durationWeeks: Number(durationWeeks),
          },
          { headers }
        );
        planId = planResponse.data.data.result.id;
      }

      // 2. Create session templates
      for (let i = 0; i < sessionTemplates.length; i++) {
        const st = sessionTemplates[i];
        const stResponse = await api.post(
          '/session-template',
          {
            name: st.name.trim(),
            dayOffset: Number(st.dayOffset),
            workoutPlanId: planId,
            notes: st.notes?.trim() || null,
          },
          { headers }
        );

        const sessionTemplate = stResponse.data.data.result;

        // 3. Create exercise templates for each session, with their per-set prescription.
        for (let j = 0; j < st.exercises.length; j++) {
          const ex = st.exercises[j];
          const isCardio = ex.type === 'cardio';
          const timed = !isCardio && !!ex.isTimed;
          const sets = ex.sets.map((set) =>
            isCardio
              ? {
                  durationSeconds: parseDuration(set.durationSeconds),
                  distance: numOrNull(set.distance),
                  rpe: numOrNull(set.rpe),
                  notes: set.notes?.trim() || null,
                }
              : timed
              ? {
                  durationSeconds: parseDuration(set.durationSeconds),
                  rpe: numOrNull(set.rpe),
                  notes: set.notes?.trim() || null,
                }
              : {
                  // Reps kept as a string so a range ("8-12") survives; blank → null.
                  reps: (set.reps ?? '').toString().trim() || null,
                  weight: Number(set.weight) || null,
                  rpe: numOrNull(set.rpe),
                  rir: numOrNull(set.rir),
                  notes: set.notes?.trim() || null,
                }
          );
          // Representative base_* values (from set 1) keep legacy consumers/fallbacks sane.
          const first = sets[0] || {};
          // baseReps (a fallback INT column) only takes a single positive number.
          const firstRepsStr = (first.reps ?? '').toString().trim();
          const baseReps = /^\d+$/.test(firstRepsStr) && Number(firstRepsStr) > 0 ? Number(firstRepsStr) : null;
          await api.post(
            '/exercise-template',
            {
              sessionTemplateId: sessionTemplate.id,
              exerciseId: Number(ex.exerciseId),
              orderIndex: j,
              baseSets: sets.length,
              baseRpe: first.rpe ?? null,
              weightUnit: ex.weightUnit || 'kg',
              isTimed: timed,
              fieldConfig: ex.fieldConfig || null,
              sets,
              notes: ex.notes?.trim() || null,
              ...(isCardio
                ? {
                    baseDurationSeconds: first.durationSeconds ?? null,
                    baseDistance: first.distance ?? null,
                  }
                : timed
                ? { baseDurationSeconds: first.durationSeconds ?? null }
                : {
                    baseReps,
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
      const msg = err.response?.data?.data?.message || (editId ? 'Failed to save plan' : 'Failed to create plan');
      setError(msg);
      console.error('Error creating plan:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="py-16 text-center text-sm text-muted">Loading…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <span
        onClick={() => navigate('/workout-plan')}
        className="cursor-pointer text-[13px] font-semibold text-clay hover:text-clay-hover"
      >
        ← Plans
      </span>
      <h1 className="mt-1 text-2xl">{editId ? 'Edit plan' : 'Create a plan'}</h1>

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
        <Card key={st.tempId} className="mb-4 p-3 sm:p-5">
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
            const timed = !isCardio && !!ex.isTimed;
            const exName =
              ex.exerciseName ||
              exercises.find((x) => x.id === Number(ex.exerciseId))?.name ||
              'Exercise';
            // Which optional fields this exercise carries, set by its own gear button.
            // Null on plans saved before field_config existed, which fall back to the profile.
            const exCfg = ex.fieldConfig || prefs || {};
            const colRpe = exCfg.showRpe !== false;
            const colRir = exCfg.showRir !== false;
            // Columns: Set, the metric input(s) (Time, or Reps + Kg/Km), then RPE / RIR
            // (RIR only for reps mode), then delete.
            // `minmax(0, …)` rather than a bare `fr`: an auto min track inherits the inputs'
            // intrinsic width and refuses to shrink, which on a phone clips them to ~2 digits.
            // Reps/weight hold up to five characters ("10-12", "102.5"); RPE/RIR at most
            // three, so on a phone they give up some of their share.
            const wide = narrow ? 'minmax(0, 1.15fr)' : 'minmax(0, 1fr)';
            const slim = narrow ? 'minmax(0, 0.85fr)' : 'minmax(0, 1fr)';
            const gridTemplate = [
              narrow ? '26px' : '28px',
              ...(timed ? [wide] : [wide, wide]),
              ...(colRpe ? [slim] : []),
              ...(!isCardio && !timed && colRir ? [slim] : []),
              narrow ? '26px' : '28px',
            ].join(' ');
            return (
            <SortableRow key={ex.tempId} id={ex.tempId}>
              {({ setNodeRef, style, handleProps, isDragging, isSorting }) => (
            <div
              ref={setNodeRef}
              style={style}
              className={`mb-2 rounded-lg border px-2 py-3 sm:px-3.5 ${isDragging ? 'border-clay shadow-lg' : 'border-line'}`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="w-4 shrink-0 font-semibold text-clay">{idx + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{exName}</div>
                  {isCardio ? (
                    <span className="mt-0.5 inline-block rounded-full bg-clay-tint px-2 py-0.5 text-[10px] font-semibold text-clay">
                      Cardio
                    </span>
                  ) : (
                    metricsOn &&
                    (() => {
                      const options = [
                        { mode: 'kg', label: 'Weight', show: prefs?.showWeight !== false },
                        { mode: 'time', label: 'Time', show: prefs?.showTime !== false },
                        { mode: 'pct', label: '1RM%', show: prefs?.showPct !== false },
                      ].filter((o) => o.show);
                      if (options.length <= 1) return null;
                      const current = timed ? 'time' : ex.weightUnit === 'pct' ? 'pct' : 'kg';
                      return (
                        <div className="mt-1 inline-flex overflow-hidden rounded-lg border border-line-strong text-[10px]">
                          {options.map(({ mode, label }) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => {
                                if (mode === 'time') setExerciseTimed(st.tempId, ex.tempId, true);
                                else {
                                  setExerciseTimed(st.tempId, ex.tempId, false);
                                  setExerciseWeightUnit(st.tempId, ex.tempId, mode);
                                }
                              }}
                              className={`px-1.5 py-0.5 font-semibold transition-colors ${
                                current === mode ? 'bg-clay-tint text-clay' : 'text-muted hover:text-ink'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
                <FieldSettingsButton
                  open={settingsFor === ex.tempId}
                  onToggle={() => setSettingsFor((cur) => (cur === ex.tempId ? null : ex.tempId))}
                />
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

              {settingsFor === ex.tempId && (
                <div className="mt-3">
                  <ExerciseFieldSettings
                    config={exCfg}
                    hideRir={isCardio || timed}
                    onChange={(patch) =>
                      mapExercise(st.tempId, ex.tempId, (e) => ({
                        ...e,
                        fieldConfig: {
                          showRpe: prefs?.showRpe !== false,
                          showRir: prefs?.showRir !== false,
                          showSetNotes: prefs?.showNotes !== false,
                          showExerciseNotes: prefs?.showNotes !== false,
                          ...(e.fieldConfig || {}),
                          ...patch,
                        },
                      }))
                    }
                  />
                </div>
              )}

              {!isSorting && (
              <div className="mt-3">
                {/* Column headers */}
                <div
                  style={{ gridTemplateColumns: gridTemplate }}
                  className="grid items-center gap-1 border-b border-line pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted sm:gap-1.5"
                >
                  <span>Set</span>
                  {timed ? (
                    <span className="text-center">Time</span>
                  ) : (
                    <>
                      <span className="text-center">{isCardio ? 'Time' : 'Reps'}</span>
                      <span className="text-center">{isCardio ? 'Km' : ex.weightUnit === 'pct' ? '%' : 'Kg'}</span>
                    </>
                  )}
                  {colRpe && <span className="text-center">RPE</span>}
                  {!isCardio && !timed && colRir && <span className="text-center">RIR</span>}
                  <span />
                </div>

                {/* One row per prescribed set, with its note on a line of its own below —
                    the set row is a fixed grid and a note needs the full width. */}
                {ex.sets.map((set, sIdx) => (
                  <React.Fragment key={sIdx}>
                  <div
                    style={{ gridTemplateColumns: gridTemplate }}
                    className={`grid items-center gap-1 py-1.5 sm:gap-1.5 ${
                      sIdx > 0 ? 'border-t border-line' : ''
                    }`}
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-clay-tint text-xs font-bold text-clay">
                      {sIdx + 1}
                    </span>
                    {timed ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="mm:ss"
                        className={numInputClass}
                        value={set.durationSeconds || ''}
                        onChange={(e) =>
                          updateSetField(st.tempId, ex.tempId, sIdx, 'durationSeconds', formatTimeInput(e.target.value))
                        }
                      />
                    ) : isCardio ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="mm:ss"
                        className={numInputClass}
                        value={set.durationSeconds}
                        onChange={(e) =>
                          updateSetField(st.tempId, ex.tempId, sIdx, 'durationSeconds', formatTimeInput(e.target.value))
                        }
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. 8-12"
                        className={numInputClass}
                        value={set.reps}
                        onChange={(e) => {
                          // A single number or a range — digits and "-" only.
                          if (!/^[0-9-]*$/.test(e.target.value)) return;
                          updateSetField(st.tempId, ex.tempId, sIdx, 'reps', e.target.value);
                        }}
                      />
                    )}
                    {!timed &&
                      (isCardio ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="–"
                        className={numInputClass}
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
                        step="0.01"
                        inputMode="decimal"
                        placeholder="–"
                        className={numInputClass}
                        value={set.weight}
                        onChange={(e) => {
                          if (Number(e.target.value) < 0) return;
                          updateSetField(st.tempId, ex.tempId, sIdx, 'weight', e.target.value);
                        }}
                      />
                    ))}
                    {colRpe && (
                      <ScoreSelect
                        value={set.rpe}
                        options={RPE_OPTIONS}
                        onChange={(v) => updateSetField(st.tempId, ex.tempId, sIdx, 'rpe', v)}
                      />
                    )}
                    {!isCardio && !timed && colRir && (
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
                  {fieldOn(exCfg, 'showSetNotes') && (
                    <input
                      type="text"
                      className={`${inputClass} mb-1 w-full`}
                      placeholder={`Note for set ${sIdx + 1} (optional)`}
                      value={set.notes || ''}
                      onChange={(e) =>
                        updateSetField(st.tempId, ex.tempId, sIdx, 'notes', e.target.value)
                      }
                    />
                  )}
                  </React.Fragment>
                ))}

                <button
                  type="button"
                  onClick={() => addSetToExercise(st.tempId, ex.tempId)}
                  className="mt-2 w-full rounded-lg border border-dashed border-line-strong py-2 text-xs font-semibold text-clay hover:border-clay hover:bg-clay-tint"
                >
                  + Add set
                </button>

                {fieldOn(exCfg, 'showExerciseNotes') && (
                  <input
                    type="text"
                    className={`${inputClass} mt-2 w-full`}
                    placeholder="Exercise note (optional) — applies to every set"
                    value={ex.notes}
                    onChange={(e) =>
                      mapExercise(st.tempId, ex.tempId, (en) => ({ ...en, notes: e.target.value }))
                    }
                  />
                )}
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
          {saving ? 'Saving…' : editId ? 'Save changes' : 'Create plan'}
        </Button>
      </div>

      {picker && (
        <ExercisePickerModal
          exercises={exercises}
          type={picker.type}
          onSelect={(ex) => addExerciseToTemplate(picker.templateTempId, ex)}
          onClose={() => setPicker(null)}
          onExerciseCreated={(ex) => setExercises((prev) => (prev.some((e) => e.id === ex.id) ? prev : [...prev, ex]))}
          onExerciseDeleted={(id) => setExercises((prev) => prev.filter((e) => e.id !== id))}
        />
      )}
    </div>
  );
}
