import React, { useState, useEffect } from 'react';
import Card from './Card';
import ExercisePickerModal from './ExercisePickerModal';
import ScoreSelect from './ScoreSelect';
import SwipeToDelete from './SwipeToDelete';
import AccentCard from './AccentCard';
import OneRepMaxCalcModal from './OneRepMaxCalcModal';
import { SortableColumn, SortableRow, GripIcon } from './Sortable';
import { parseDuration, formatDuration, formatTimeInput, pace } from '../duration';

const inputClass =
  'w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm focus:border-clay focus:outline-none focus:ring-[3px] focus:ring-clay-tint';

const numInputClass =
  'w-full rounded-lg border border-line-strong bg-surface px-2 py-2.5 text-center text-sm focus:border-clay focus:outline-none focus:ring-[3px] focus:ring-clay-tint';

const dashedButtonClass =
  'w-full rounded-lg border border-dashed border-line-strong py-3 text-sm font-semibold text-clay hover:border-clay hover:bg-clay-tint';

// RPE: 1–10 in 0.5 steps. RIR: 1–10 in whole steps. Both optional (blank = not set).
const RPE_OPTIONS = Array.from({ length: 19 }, (_, i) => 1 + i * 0.5);
const RIR_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

const Eyebrow = ({ children }) => (
  <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
    {children}
  </span>
);

/**
 * The shared session builder UI: an editable title, an optional session note, a list of
 * exercise cards each with a per-set table (reorderable, swipe-to-delete on touch), and
 * "+ Add exercise / + Add cardio". It is purely presentational — it owns only UI-local
 * state (which name is being edited, the picker, drag) and drives all data through the
 * callbacks below, so the same builder backs both a live session (each edit persists to
 * the API) and a template (edits stay local until saved once).
 *
 * Data adapter props:
 *  - name / onNameChange, note / onNoteChange
 *  - logs: flat array of set entries ({ id?, Exercise:{name,type}, reps, weight,
 *          durationSeconds (as "mm:ss" string in inputs), distance, rpe, rir, notes,
 *          orderIndex }) — the view groups + orders them by exercise.
 *  - onAddExercise(exercise), onAddSet(exerciseName)
 *  - onUpdateLog(log, patch): patch one set's fields locally
 *  - onCommitLog(log): optional — persist one set (blur); live persists, template no-ops
 *  - onDeleteSet(log), onDeleteExercise(exerciseName)
 *  - onReorder(orderedNames): apply a new exercise order
 * Presentation props: statusEyebrow (node above the title), footer (node at the bottom).
 */
export default function SessionBuilderView({
  name,
  onNameChange,
  namePlaceholder = 'New session',
  statusEyebrow,
  note,
  onNoteChange,
  logs,
  exercises,
  onAddExercise,
  onAddSet,
  onUpdateLog,
  onCommitLog,
  onDeleteSet,
  onDeleteExercise,
  onReorder,
  onSetWeightUnit,
  onSetOneRepMax,
  footer,
  // Template-building mode: reps is a free-text field (allows a range like "8-12") and
  // fields show generic placeholders instead of a prescribed target.
  templateMode = false,
}) {
  // A prescribed target → placeholder text (or a dash when there's none).
  const ph = (v) => (v != null && v !== '' ? String(v) : '–');
  const [editingName, setEditingName] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [pickerType, setPickerType] = useState(null); // null | 'strength' | 'cardio'
  const [oneRmCalc, setOneRmCalc] = useState(null); // { exerciseId, exerciseName } | null

  const [coarse, setCoarse] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches
  );
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(pointer: coarse)');
    const on = (e) => setCoarse(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const commit = (log) => onCommitLog?.(log);

  // Running total (kg): sum of reps × weight across all sets.
  const totalKg = Array.isArray(logs)
    ? logs.reduce((sum, log) => sum + ((Number(log.reps) * Number(log.weight)) || 0), 0)
    : 0;

  // Group logs by exercise name, ordered by each exercise's orderIndex (falling back to
  // first appearance for legacy logs without one).
  const groupedLogs =
    Array.isArray(logs) && logs.length > 0
      ? Object.entries(
          logs.reduce((acc, log) => {
            const exerciseName = log.Exercise.name;
            if (!acc[exerciseName]) acc[exerciseName] = [];
            acc[exerciseName].push(log);
            return acc;
          }, {})
        )
          .map(([n, l], i) => ({ name: n, logs: l, order: l[0]?.orderIndex ?? i }))
          .sort((a, b) => a.order - b.order)
          .map((g) => [g.name, g.logs])
      : [];

  // Move an exercise up/down one slot (desktop arrows).
  const moveExercise = (exerciseName, direction) => {
    const order = groupedLogs.map(([n]) => n);
    const idx = order.indexOf(exerciseName);
    const target = idx + direction;
    if (target < 0 || target >= order.length) return;
    [order[idx], order[target]] = [order[target], order[idx]];
    onReorder(order);
  };

  const showNotes = notesOpen || !!note;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div>
        {/* Header — title with an edit button that toggles inline editing */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {statusEyebrow}
            {editingName ? (
              <input
                data-title
                autoFocus
                type="text"
                id="sessionName"
                name="sessionName"
                aria-label="Session name"
                placeholder={namePlaceholder}
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    e.preventDefault();
                    setEditingName(false);
                  }
                }}
                className="mt-1 w-full bg-transparent text-2xl font-[650] tracking-[-0.02em] text-ink placeholder:text-muted focus:outline-none"
              />
            ) : (
              <div className="mt-1 flex items-center gap-1.5">
                <h1 className={`truncate text-2xl ${name ? '' : 'text-muted'}`}>
                  {name || namePlaceholder}
                </h1>
                <button
                  type="button"
                  aria-label="Edit session name"
                  title="Edit name"
                  onClick={() => setEditingName(true)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-clay"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          <div className="shrink-0 text-sm text-muted">
            <span className={totalKg > 0 ? 'font-bold text-clay' : 'font-semibold text-ink'}>
              {totalKg.toLocaleString()}
            </span>{' '}
            kg total
          </div>
        </div>

        {/* Session notes — optional; collapsed behind a button until wanted. */}
        {showNotes ? (
          <Card className="group mt-5 border border-clay-tintborder bg-surface-2 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-clay-tint text-clay">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 6h14M5 12h14M5 18h9" />
                  </svg>
                </span>
                <Eyebrow>Session notes</Eyebrow>
              </div>
              <button
                type="button"
                title="Remove note"
                onClick={() => {
                  setNotesOpen(false);
                  onNoteChange('');
                }}
                className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-surface hover:text-danger"
              >
                ✕
              </button>
            </div>
            <textarea
              className={`${inputClass} mt-3 min-h-[84px] resize-y`}
              placeholder="How did the session go?"
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
            />
          </Card>
        ) : (
          <button type="button" onClick={() => setNotesOpen(true)} className={`${dashedButtonClass} mt-5`}>
            + Add session note
          </button>
        )}

        {/* Exercises */}
        {groupedLogs.length > 0 && (
          <>
            {/* RPE/RIR legend — mobile only (the header tooltips are hover-only) */}
            <p className="mt-4 text-center text-[11px] text-muted sm:hidden">
              RPE = perceived exertion (1–10) · RIR = reps in reserve
            </p>
            <SortableColumn
              items={groupedLogs.map(([name]) => name)}
              onReorder={onReorder}
              className="mt-2 flex flex-col gap-5 sm:mt-5"
            >
              {groupedLogs.map(([exerciseName, exLogs], groupIndex) => {
                const isCardio = exLogs[0]?.Exercise?.type === 'cardio';
                const isPct = (exLogs[0]?.weightUnit || 'kg') === 'pct';
                // Live logging: any set prescribed by % (needs room below for its label).
                const anyPct = !templateMode && exLogs.some((l) => l.targetWeightPct != null);
                return (
                  <SortableRow key={exerciseName} id={exerciseName}>
                    {({ setNodeRef, style, handleProps, isDragging, isSorting }) => (
                      <div ref={setNodeRef} style={style}>
                        <AccentCard
                          contentClassName="p-5"
                          className={isDragging ? 'shadow-xl ring-2 ring-clay-tint' : ''}
                        >
                          <div className="mb-3 flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-ink">{exerciseName}</div>
                              {isCardio && (
                                <span className="mt-1 inline-block rounded-full bg-clay-tint px-2 py-0.5 text-[11px] font-semibold text-clay">
                                  Cardio
                                </span>
                              )}
                              {templateMode && !isCardio && (
                                <div className="mt-1.5 inline-flex overflow-hidden rounded-lg border border-line-strong text-[11px]">
                                  {[
                                    { u: 'kg', label: 'kg' },
                                    { u: 'pct', label: '% 1RM' },
                                  ].map(({ u, label }) => (
                                    <button
                                      key={u}
                                      type="button"
                                      onClick={() => onSetWeightUnit?.(exerciseName, u)}
                                      className={`px-2 py-0.5 font-semibold transition-colors ${
                                        (isPct ? 'pct' : 'kg') === u
                                          ? 'bg-clay-tint text-clay'
                                          : 'text-muted hover:text-ink'
                                      }`}
                                    >
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-2">
                              {coarse ? (
                                <button
                                  type="button"
                                  aria-label="Hold and drag to reorder"
                                  className="grid h-8 w-8 cursor-grab touch-none select-none place-items-center rounded-lg border border-line-strong text-ink active:cursor-grabbing active:bg-clay-tint active:text-clay"
                                  {...handleProps}
                                >
                                  <GripIcon />
                                </button>
                              ) : (
                                <div className="flex items-center overflow-hidden rounded-lg border border-line-strong">
                                  <button
                                    type="button"
                                    title="Move up"
                                    disabled={groupIndex === 0}
                                    onClick={() => moveExercise(exerciseName, -1)}
                                    className="grid h-8 w-8 place-items-center text-ink transition-colors hover:bg-clay-tint hover:text-clay disabled:pointer-events-none disabled:opacity-25"
                                  >
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6" /></svg>
                                  </button>
                                  <div className="h-8 w-px bg-line" />
                                  <button
                                    type="button"
                                    title="Move down"
                                    disabled={groupIndex === groupedLogs.length - 1}
                                    onClick={() => moveExercise(exerciseName, 1)}
                                    className="grid h-8 w-8 place-items-center text-ink transition-colors hover:bg-clay-tint hover:text-clay disabled:pointer-events-none disabled:opacity-25"
                                  >
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                                  </button>
                                </div>
                              )}
                              <button
                                type="button"
                                title="Delete exercise"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this exercise?')) {
                                    onDeleteExercise(exerciseName);
                                  }
                                }}
                                className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg border border-line-strong text-ink transition-colors hover:border-danger hover:bg-danger/10 hover:text-danger"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6M14 11v6" /></svg>
                              </button>
                            </div>
                          </div>

                          {!isSorting && (
                            <>
                              {/* Table header */}
                              <div className="grid grid-cols-[30px_1fr_1fr_1fr_1fr] gap-1.5 border-b border-line pb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-ink sm:grid-cols-[34px_1fr_1fr_72px_72px_1.2fr] sm:gap-2">
                                <span>Set</span>
                                <span className="text-center">{isCardio ? 'Time' : 'Reps'}</span>
                                <span className="text-center">{isCardio ? 'Km' : isPct ? '%' : 'Kg'}</span>
                                <span
                                  className="cursor-help text-center underline decoration-dotted decoration-muted underline-offset-2"
                                  title="RPE — Rate of Perceived Exertion: how hard the set felt (1 easy → 10 max effort)"
                                >
                                  RPE
                                </span>
                                {isCardio ? (
                                  <span className="text-center">Pace</span>
                                ) : (
                                  <span
                                    className="cursor-help text-center underline decoration-dotted decoration-muted underline-offset-2"
                                    title="RIR — Reps In Reserve: how many more good reps you could have done"
                                  >
                                    RIR
                                  </span>
                                )}
                                <span className="hidden sm:block">Notes</span>
                              </div>

                              {/* Set rows */}
                              {exLogs.map((log, index) => (
                                <SwipeToDelete
                                  key={log.id ?? `tmp-${index}`}
                                  enabled={coarse}
                                  onDelete={() => onDeleteSet(log)}
                                >
                                  <div
                                    className={`grid grid-cols-[30px_1fr_1fr_1fr_1fr] items-center gap-1.5 py-3 sm:grid-cols-[34px_1fr_1fr_72px_72px_1.2fr] sm:gap-2 ${
                                      anyPct ? 'pb-7' : ''
                                    } ${index > 0 ? 'border-t border-line' : ''}`}
                                  >
                                    <div className="row-span-2 flex items-center self-center sm:row-span-1">
                                      <span className="grid h-6 w-6 place-items-center rounded-full bg-clay-tint text-xs font-bold text-clay">
                                        {index + 1}
                                      </span>
                                    </div>
                                    {isCardio ? (
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder={templateMode || !log.targetDurationSeconds ? 'mm:ss' : formatDuration(log.targetDurationSeconds)}
                                        className={numInputClass}
                                        value={log.durationSeconds || ''}
                                        onChange={(e) => onUpdateLog(log, { durationSeconds: formatTimeInput(e.target.value) })}
                                        onBlur={() => commit(log)}
                                      />
                                    ) : templateMode ? (
                                      <input
                                        type="text"
                                        placeholder="e.g. 8-12"
                                        className={numInputClass}
                                        value={log.reps ?? ''}
                                        onChange={(e) => {
                                          const v = e.target.value;
                                          // A single number or a range — digits and "-" only.
                                          if (!/^[0-9-]*$/.test(v)) return;
                                          onUpdateLog(log, { reps: v });
                                        }}
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder={ph(log.targetReps)}
                                        className={numInputClass}
                                        value={log.reps ?? ''}
                                        onChange={(e) => {
                                          const v = e.target.value;
                                          // Logging reps must be a whole number (ranges/decimals
                                          // are only for the plan/template builder).
                                          if (v !== '' && !/^\d+$/.test(v)) return;
                                          onUpdateLog(log, { reps: v });
                                        }}
                                        onBlur={() => commit(log)}
                                      />
                                    )}
                                    {isCardio ? (
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        inputMode="decimal"
                                        placeholder={templateMode ? '–' : ph(log.targetDistance)}
                                        className={numInputClass}
                                        value={log.distance ?? ''}
                                        onChange={(e) => {
                                          if (Number(e.target.value) < 0) return;
                                          onUpdateLog(log, { distance: e.target.value });
                                        }}
                                        onBlur={() => commit(log)}
                                      />
                                    ) : (
                                      <div className="relative">
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          inputMode="decimal"
                                          placeholder={
                                            templateMode
                                              ? '–'
                                              : log.targetWeight != null && log.targetWeight !== ''
                                              ? String(log.targetWeight)
                                              : log.targetWeightPct != null
                                              ? `${log.targetWeightPct}%`
                                              : '–'
                                          }
                                          className={numInputClass}
                                          value={log.weight ?? ''}
                                          onChange={(e) => {
                                            if (Number(e.target.value) < 0) return;
                                            onUpdateLog(log, { weight: e.target.value });
                                          }}
                                          onBlur={() => commit(log)}
                                        />
                                        {/* Absolutely positioned so it never changes the input's
                                            height / breaks alignment with the other columns. */}
                                        {!templateMode &&
                                          log.targetWeight != null &&
                                          log.targetWeight !== '' &&
                                          log.targetWeightPct != null && (
                                            <span className="pointer-events-none absolute inset-x-0 top-full mt-1 text-center text-[11px] font-semibold leading-none text-clay">
                                              {log.weight != null && log.weight !== '' && Number(log.weight) > 0
                                                ? `${Math.round((Number(log.weight) * Number(log.targetWeightPct)) / Number(log.targetWeight))}% of 1RM`
                                                : `Target ${log.targetWeightPct}% of 1RM (${log.targetWeight} kg)`}
                                            </span>
                                          )}
                                        {!templateMode &&
                                          onSetOneRepMax &&
                                          log.targetWeightPct != null &&
                                          (log.targetWeight == null || log.targetWeight === '') && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setOneRmCalc({
                                                  exerciseId: log.exerciseId,
                                                  exerciseName: log.Exercise?.name,
                                                })
                                              }
                                              className="absolute inset-x-0 top-full mx-auto mt-1 w-max rounded-full bg-clay-tint px-2 py-0.5 text-[11px] font-semibold leading-none text-clay hover:bg-clay hover:text-white"
                                            >
                                              Set 1RM
                                            </button>
                                          )}
                                      </div>
                                    )}
                                    <ScoreSelect
                                      value={log.rpe ?? ''}
                                      options={RPE_OPTIONS}
                                      onChange={(v) => {
                                        onUpdateLog(log, { rpe: v });
                                        // Dropdowns have no blur — persist the change now so it
                                        // survives leaving and resuming the session.
                                        commit({ ...log, rpe: v });
                                      }}
                                    />
                                    {isCardio ? (
                                      <div className="grid place-items-center text-center text-sm text-muted">
                                        {pace(parseDuration(log.durationSeconds), log.distance) || '–'}
                                      </div>
                                    ) : (
                                      <ScoreSelect
                                        value={log.rir ?? ''}
                                        options={RIR_OPTIONS}
                                        onChange={(v) => {
                                          onUpdateLog(log, { rir: v });
                                          commit({ ...log, rir: v });
                                        }}
                                      />
                                    )}
                                    <div className="col-span-4 col-start-2 mt-1.5 flex items-center gap-1.5 sm:col-span-1 sm:col-start-auto sm:mt-0">
                                      <input
                                        type="text"
                                        placeholder="Notes"
                                        className={`${inputClass} min-w-0 flex-1`}
                                        value={log.notes || ''}
                                        onChange={(e) => onUpdateLog(log, { notes: e.target.value })}
                                        onBlur={() => commit(log)}
                                      />
                                      {!coarse && (
                                        <button
                                          type="button"
                                          title="Delete set"
                                          onClick={() => onDeleteSet(log)}
                                          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line-strong text-ink transition-colors hover:border-danger hover:bg-danger/10 hover:text-danger"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </SwipeToDelete>
                              ))}

                              <div className="mt-2">
                                <button className={dashedButtonClass} onClick={() => onAddSet(exerciseName)}>
                                  + Add set
                                </button>
                              </div>
                            </>
                          )}
                        </AccentCard>
                      </div>
                    )}
                  </SortableRow>
                );
              })}
            </SortableColumn>
          </>
        )}

        {/* Add exercise / cardio */}
        <div className="mt-5 flex flex-col gap-2">
          <button className={dashedButtonClass} onClick={() => setPickerType('strength')}>
            + Add exercise
          </button>
          <button className={dashedButtonClass} onClick={() => setPickerType('cardio')}>
            + Add cardio
          </button>
        </div>

        {/* Footer actions (provided by the host page) */}
        <div className="flex items-center justify-between pt-2">{footer}</div>
      </div>

      {pickerType && (
        <ExercisePickerModal
          type={pickerType}
          exercises={exercises}
          onClose={() => setPickerType(null)}
          onSelect={(exercise) => onAddExercise(exercise)}
        />
      )}

      {oneRmCalc && (
        <OneRepMaxCalcModal
          exerciseName={oneRmCalc.exerciseName}
          onClose={() => setOneRmCalc(null)}
          onSet={(oneRm) => {
            onSetOneRepMax?.(oneRmCalc.exerciseId, oneRm);
            setOneRmCalc(null);
          }}
        />
      )}
    </div>
  );
}

export { Eyebrow };
