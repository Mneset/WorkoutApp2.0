import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Button from './Button';
import SessionBuilderView, { Eyebrow } from './SessionBuilderView';
import { parseDuration, formatDuration } from '../duration';

const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

/**
 * Build a reusable, standalone session template using the exact same builder as a live
 * session — but everything is edited in local state and saved once as a SessionTemplate
 * (with per-set ExerciseTemplates) rather than persisting each edit.
 */
export default function CreateTemplatePage() {
  const { getToken, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeId } = useParams();
  // Edit mode: the id comes from the URL (so it survives a reload). The full nested
  // template rides along via nav state as a fast path; on a hard refresh we fetch it.
  const editId = routeId ? Number(routeId) : null;
  const [editTemplate, setEditTemplate] = useState(location.state?.editTemplate || null);

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

  // On a hard reload the nav state is gone — fetch the template by its URL id.
  useEffect(() => {
    if (!editId || editTemplate) return;
    (async () => {
      try {
        const accessToken = await getToken();
        const res = await api.get('/session-template/standalone', {
          params: { userId: user.sub },
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const found = (res.data?.data?.result || []).find((t) => t.id === editId);
        if (found) setEditTemplate(found);
        else setError('Template not found');
      } catch (err) {
        setError('Failed to load template');
        console.error(err);
      }
    })();
  }, [editId, editTemplate, getToken, user]);

  // Populate the builder from the template being edited (once it's available).
  const populated = useRef(false);
  useEffect(() => {
    if (!editTemplate || populated.current) return;
    populated.current = true;
    setName(editTemplate.name || '');
    setNotes(editTemplate.notes || '');
    const rows = [];
    const sorted = [...(editTemplate.ExerciseTemplates || [])].sort(
      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
    );
    sorted.forEach((et, idx) => {
      const isCardio = et.Exercise?.type === 'cardio';
      const sets = Array.isArray(et.sets) && et.sets.length ? et.sets : [{}];
      sets.forEach((s) => {
        rows.push({
          id: makeId(),
          exerciseId: et.exerciseId,
          orderIndex: idx,
          notes: s.notes ?? '',
          weightUnit: et.weightUnit || 'kg',
          Exercise: { name: et.Exercise?.name, type: et.Exercise?.type },
          ...(isCardio
            ? {
                durationSeconds: s.durationSeconds ? formatDuration(s.durationSeconds) : '',
                distance: s.distance ?? '',
                rpe: s.rpe ?? null,
              }
            : { reps: s.reps ?? '', weight: s.weight ?? '', rpe: s.rpe ?? null, rir: s.rir ?? null }),
        });
      });
    });
    setLogs(rows);
  }, [editTemplate]);

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
        weightUnit: 'kg',
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
        weightUnit: last.weightUnit || 'kg',
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

  // Switch an exercise's weight unit (kg ↔ % of 1RM) across all its sets.
  const setWeightUnit = (exerciseName, unit) =>
    setLogs((prev) => prev.map((l) => (l.Exercise?.name === exerciseName ? { ...l, weightUnit: unit } : l)));

  const applyOrder = (order) => {
    const orderByName = Object.fromEntries(order.map((n, i) => [n, i]));
    setLogs((prev) => prev.map((l) => ({ ...l, orderIndex: orderByName[l.Exercise?.name] ?? l.orderIndex })));
  };

  // Group logs into ordered exercises (mirrors the builder's grouping).
  const groupedExercises = () => {
    const map = new Map();
    for (const l of logs) {
      const n = l.Exercise?.name;
      if (!map.has(n)) map.set(n, { name: n, type: l.Exercise?.type, exerciseId: l.exerciseId, weightUnit: l.weightUnit || 'kg', order: l.orderIndex ?? 0, sets: [] });
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

      // 1. Create the template, or update it and clear its old exercises for replacement.
      let templateId;
      if (editId) {
        await api.put(
          `/session-template/${editId}`,
          { name: name.trim(), notes: notes.trim() || null },
          { headers }
        );
        for (const et of editTemplate?.ExerciseTemplates || []) {
          await api.delete(`/exercise-template/${et.id}`, { headers });
        }
        templateId = editId;
      } else {
        const tplRes = await api.post(
          '/session-template',
          { name: name.trim(), userId: user.sub, notes: notes.trim() || null },
          { headers }
        );
        templateId = tplRes.data.data.result.id;
      }

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
                // Reps kept as a string so a range ("8-12") survives; blank → null.
                reps: (s.reps ?? '').toString().trim() || null,
                weight: numOrNull(s.weight),
                rpe: numOrNull(s.rpe),
                rir: numOrNull(s.rir),
                notes: s.notes?.trim() || null,
              }
        );
        const first = sets[0] || {};
        // baseReps (a fallback INT column) only takes a single positive number.
        const firstRepsStr = (first.reps ?? '').toString().trim();
        const baseReps = /^\d+$/.test(firstRepsStr) && Number(firstRepsStr) > 0 ? Number(firstRepsStr) : null;
        await api.post(
          '/exercise-template',
          {
            sessionTemplateId: templateId,
            exerciseId: Number(g.exerciseId),
            orderIndex: j,
            baseSets: sets.length,
            baseRpe: first.rpe ?? null,
            weightUnit: g.weightUnit,
            sets,
            ...(isCardio
              ? { baseDurationSeconds: first.durationSeconds ?? null, baseDistance: first.distance ?? null }
              : {
                  baseReps,
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
        templateMode
        statusEyebrow={<Eyebrow>{editId ? 'EDIT TEMPLATE' : 'NEW TEMPLATE'}</Eyebrow>}
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
        onSetWeightUnit={setWeightUnit}
        footer={
          <>
            <Button variant="ghost" onClick={() => navigate('/workout-plan?view=templates')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editId ? 'Save changes' : 'Save template'}
            </Button>
          </>
        }
      />
    </>
  );
}
