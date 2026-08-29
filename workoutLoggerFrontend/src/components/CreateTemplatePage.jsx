import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Button from './Button';
import SessionBuilderView, { Eyebrow } from './SessionBuilderView';
import { parseDuration } from '../duration';

const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

/**
 * Build a reusable, standalone session template using the exact same builder as a live
 * session — but everything is edited in local state and saved once as a SessionTemplate
 * (with per-set ExerciseTemplates) rather than persisting each edit.
 */
export default function CreateTemplatePage() {
  const { getToken, user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [logs, setLogs] = useState([]); // flat set entries, same shape the builder uses
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Local ids for set rows (the builder keys/patches by `id`).
  const nextId = useRef(1);
  const makeId = () => nextId.current++;

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

  const blankFields = (isCardio, from = {}) =>
    isCardio
      ? { durationSeconds: from.durationSeconds || '', distance: from.distance ?? '', rpe: from.rpe ?? null }
      : {
          reps: from.reps ?? '',
          weight: from.weight ?? '',
          rpe: from.rpe ?? null,
          rir: from.rir ?? null,
        };

  const handleAddExercise = (exercise) => {
    const isCardio = exercise.type === 'cardio';
    const orderIndex = new Set(logs.map((l) => l.Exercise?.name)).size;
    setLogs((prev) => [
      ...prev,
      {
        id: makeId(),
        exerciseId: exercise.id,
        orderIndex,
        notes: '',
        Exercise: { name: exercise.name, type: exercise.type },
        ...blankFields(isCardio),
      },
    ]);
  };

  const handleAddSet = (exerciseName) => {
    setLogs((prev) => {
      const forEx = prev.filter((l) => l.Exercise?.name === exerciseName);
      if (forEx.length === 0) return prev;
      const last = forEx[forEx.length - 1];
      const isCardio = last.Exercise?.type === 'cardio';
      const newLog = {
        id: makeId(),
        exerciseId: last.exerciseId,
        orderIndex: last.orderIndex,
        notes: '',
        Exercise: last.Exercise,
        ...blankFields(isCardio, last),
      };
      // Insert right after the exercise's existing sets so grouping stays contiguous.
      const lastIdx = prev.map((l) => l.Exercise?.name).lastIndexOf(exerciseName);
      const next = [...prev];
      next.splice(lastIdx + 1, 0, newLog);
      return next;
    });
  };

  const updateLog = (log, patch) =>
    setLogs((prev) => prev.map((l) => (l.id === log.id ? { ...l, ...patch } : l)));

  const deleteSet = (log) => setLogs((prev) => prev.filter((l) => l.id !== log.id));

  const deleteExercise = (exerciseName) =>
    setLogs((prev) => prev.filter((l) => l.Exercise?.name !== exerciseName));

  const applyOrder = (order) => {
    const orderByName = Object.fromEntries(order.map((n, i) => [n, i]));
    setLogs((prev) => prev.map((l) => ({ ...l, orderIndex: orderByName[l.Exercise?.name] ?? l.orderIndex })));
  };

  // Group logs into ordered exercises (mirrors the builder's grouping).
  const groupedExercises = () => {
    const map = new Map();
    for (const l of logs) {
      const n = l.Exercise?.name;
      if (!map.has(n)) map.set(n, { name: n, type: l.Exercise?.type, exerciseId: l.exerciseId, order: l.orderIndex ?? 0, sets: [] });
      map.get(n).sets.push(l);
    }
    return [...map.values()].sort((a, b) => a.order - b.order);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }
    const groups = groupedExercises();
    if (groups.length === 0) {
      setError('Add at least one exercise');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const accessToken = await getToken();
      const headers = { Authorization: `Bearer ${accessToken}` };

      // 1. Create the standalone template (owned by the user, no plan).
      const tplRes = await api.post(
        '/session-template',
        { name: name.trim(), userId: user.sub, notes: notes.trim() || null },
        { headers }
      );
      const template = tplRes.data.data.result;

      // 2. One exercise-template per exercise, carrying its per-set prescription.
      for (let j = 0; j < groups.length; j++) {
        const g = groups[j];
        const isCardio = g.type === 'cardio';
        const sets = g.sets.map((s) =>
          isCardio
            ? {
                durationSeconds: parseDuration(s.durationSeconds),
                distance: numOrNull(s.distance),
                rpe: numOrNull(s.rpe),
                notes: s.notes?.trim() || null,
              }
            : {
                reps: numOrNull(s.reps),
                weight: numOrNull(s.weight),
                rpe: numOrNull(s.rpe),
                rir: numOrNull(s.rir),
                notes: s.notes?.trim() || null,
              }
        );
        const first = sets[0] || {};
        await api.post(
          '/exercise-template',
          {
            sessionTemplateId: template.id,
            exerciseId: Number(g.exerciseId),
            orderIndex: j,
            baseSets: sets.length,
            baseRpe: first.rpe ?? null,
            sets,
            ...(isCardio
              ? { baseDurationSeconds: first.durationSeconds ?? null, baseDistance: first.distance ?? null }
              : {
                  // baseReps must be positive if present; fall back to null otherwise.
                  baseReps: first.reps > 0 ? first.reps : null,
                  baseWeight: first.weight ?? null,
                  baseRir: first.rir ?? null,
                }),
          },
          { headers }
        );
      }

      navigate('/workout-plan?view=templates');
    } catch (err) {
      const msg = err.response?.data?.data?.message || 'Failed to save template';
      setError(msg);
      console.error('Error saving template:', err);
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
    <>
      {error && (
        <div className="mx-auto max-w-3xl px-6 pt-6">
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
        </div>
      )}
      <SessionBuilderView
        name={name}
        onNameChange={setName}
        namePlaceholder="New template"
        statusEyebrow={<Eyebrow>NEW TEMPLATE</Eyebrow>}
        note={notes}
        onNoteChange={setNotes}
        logs={logs}
        exercises={exercises}
        onAddExercise={handleAddExercise}
        onAddSet={handleAddSet}
        onUpdateLog={updateLog}
        onDeleteSet={deleteSet}
        onDeleteExercise={deleteExercise}
        onReorder={applyOrder}
        footer={
          <>
            <Button variant="ghost" onClick={() => navigate('/workout-plan?view=templates')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save template'}
            </Button>
          </>
        }
      />
    </>
  );
}
