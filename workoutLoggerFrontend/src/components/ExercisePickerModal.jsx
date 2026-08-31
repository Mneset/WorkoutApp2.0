import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../context/UserContext';
import api from '../api';
import Card from './Card';
import ExerciseDetail, { IMG_CDN } from './ExerciseDetail';

const inputClass =
  'w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm focus:border-clay focus:outline-none focus:ring-[3px] focus:ring-clay-tint';

function StarIcon({ filled }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2 15.09 8.26 22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  );
}

// `type` scopes the list: 'strength' (the default) or 'cardio' — each has its own picker.
function ExercisePickerModal({ exercises = [], onSelect, onClose, type = 'strength', onExerciseCreated, onExerciseDeleted }) {
  const { getToken } = useAuth();
  const { profile } = useUserProfile();
  // Basic-only hides the very specific variations (kept as a graceful default until the
  // backend ships the is_basic flag — undefined is treated as basic so nothing vanishes).
  const basicOnly = profile?.preferences?.basicExercisesOnly !== false;
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [view, setView] = useState('all'); // 'all' | 'favorites'
  const [expandedId, setExpandedId] = useState(null);
  const [details, setDetails] = useState({}); // id -> { instructions, images } | 'loading' | 'error'
  // Create-your-own-exercise form.
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [primaryIds, setPrimaryIds] = useState(() => new Set());
  const [secondaryIds, setSecondaryIds] = useState(() => new Set());
  const [equipIds, setEquipIds] = useState(() => new Set());
  const [newSteps, setNewSteps] = useState(['']); // ordered instruction steps
  const [savingNew, setSavingNew] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [taxonomy, setTaxonomy] = useState({ muscles: [], equipment: [] });

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const headers = { Authorization: `Bearer ${await getToken()}` };
        const res = await api.get('/favorite-exercises', { headers });
        setFavoriteIds(new Set(res.data?.data?.result || []));
      } catch (err) {
        console.error('Error loading favorites:', err);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the muscle/equipment taxonomy the first time the create form is opened.
  useEffect(() => {
    if (!creating || taxonomy.muscles.length || taxonomy.equipment.length) return;
    const load = async () => {
      try {
        const headers = { Authorization: `Bearer ${await getToken()}` };
        const res = await api.get('/exercise-log/taxonomy', { headers });
        const d = res.data?.data?.result || {};
        setTaxonomy({ muscles: d.muscles || [], equipment: d.equipment || [] });
      } catch (err) {
        console.error('Error loading taxonomy:', err);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creating]);

  const toggleFavorite = async (exerciseId) => {
    const isFav = favoriteIds.has(exerciseId);
    // Optimistic update.
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
    try {
      const headers = { Authorization: `Bearer ${await getToken()}` };
      if (isFav) {
        await api.delete(`/favorite-exercises/${exerciseId}`, { headers });
      } else {
        await api.post('/favorite-exercises', { exerciseId }, { headers });
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // Revert on failure.
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(exerciseId);
        else next.delete(exerciseId);
        return next;
      });
    }
  };

  const toggleDetails = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (details[id]) return; // already loaded
    setDetails((prev) => ({ ...prev, [id]: 'loading' }));
    try {
      const headers = { Authorization: `Bearer ${await getToken()}` };
      const res = await api.get(`/exercise-log/details/${id}`, { headers });
      const d = res.data?.data?.result || {};
      setDetails((prev) => ({ ...prev, [id]: { instructions: d.instructions || [], images: d.images || [] } }));
    } catch (err) {
      console.error('Error loading exercise details:', err);
      setDetails((prev) => ({ ...prev, [id]: 'error' }));
    }
  };

  const isCardio = type === 'cardio';
  const ofType = exercises.filter((ex) => (ex.type === 'cardio' ? 'cardio' : 'strength') === type);

  const filteredExercises = ofType.filter((ex) => {
    const matchesName = ex.name.toLowerCase().includes(search.toLowerCase());
    // Match the PRIMARY mover only, so "Chest" shows exercises chest actually drives —
    // not ones where it's just a secondary mover.
    const matchesMuscle =
      selectedMuscle === '' ||
      (ex.TargetMuscles &&
        ex.TargetMuscles.some(
          (muscle) =>
            muscle.name.toLowerCase() === selectedMuscle.toLowerCase() &&
            // Primary-only when the flag is present; if the backend hasn't shipped it yet,
            // fall back to matching any involvement so the filter never returns nothing.
            (muscle.ExerciseTargetMuscle?.isPrimary ?? true)
        ));
    return matchesName && matchesMuscle;
  });

  // Favorites are always shown (you chose them); the basic filter only trims the main list.
  const favoritesList = filteredExercises.filter((ex) => favoriteIds.has(ex.id));
  const nonFavorites = filteredExercises.filter(
    (ex) => !favoriteIds.has(ex.id) && (!basicOnly || ex.isBasic !== false)
  );

  // Target muscles present in this picker's exercises (strength only uses the filter).
  const allTargetMuscles = ofType.reduce((muscles, ex) => {
    if (ex.TargetMuscles) {
      ex.TargetMuscles.forEach((muscle) => {
        if (!muscles.some((m) => m.name === muscle.name)) muscles.push(muscle);
      });
    }
    return muscles;
  }, []);

  // Sort A→Z and group by first letter (non-letters bucket under "#", pushed to the end).
  const groupByLetter = (list) => {
    const sorted = [...list].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
    const groups = [];
    let current = null;
    for (const ex of sorted) {
      const ch = ex.name.trim()[0]?.toUpperCase() || '#';
      const letter = /[A-Z]/.test(ch) ? ch : '#';
      if (!current || current.letter !== letter) {
        current = { letter, items: [] };
        groups.push(current);
      }
      current.items.push(ex);
    }
    const hashIndex = groups.findIndex((g) => g.letter === '#');
    if (hashIndex > -1) groups.push(groups.splice(hashIndex, 1)[0]);
    return groups;
  };

  // In "All" view the favorites are pinned in their own section above the A–Z list; in
  // "Favorites" view the whole list is the favorites, alphabetised.
  const letterGroups = view === 'favorites' ? groupByLetter(favoritesList) : groupByLetter(nonFavorites);

  const handleSelect = (ex) => {
    setSelectedId(ex.id);
    onSelect(ex);
    onClose();
  };

  // Each muscle chip cycles: off → primary → secondary → off.
  const cycleMuscle = (id) => {
    if (primaryIds.has(id)) {
      setPrimaryIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setSecondaryIds((prev) => new Set(prev).add(id));
    } else if (secondaryIds.has(id)) {
      setSecondaryIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      setPrimaryIds((prev) => new Set(prev).add(id));
    }
  };

  const toggleEquip = (id) =>
    setEquipIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const updateStep = (i, val) => setNewSteps((prev) => prev.map((s, idx) => (idx === i ? val : s)));
  const addStep = () => setNewSteps((prev) => [...prev, '']);
  const removeStep = (i) => setNewSteps((prev) => (prev.length === 1 ? [''] : prev.filter((_, idx) => idx !== i)));

  const resetCreateForm = () => {
    setCreating(false);
    setNewName('');
    setPrimaryIds(new Set());
    setSecondaryIds(new Set());
    setEquipIds(new Set());
    setNewSteps(['']);
    setCreateError(null);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setSavingNew(true);
    setCreateError(null);
    try {
      const headers = { Authorization: `Bearer ${await getToken()}` };
      const instructions = newSteps.map((s) => s.trim()).filter(Boolean);
      const res = await api.post(
        '/exercise-log/exercise',
        {
          name,
          type,
          primaryMuscleIds: [...primaryIds],
          secondaryMuscleIds: [...secondaryIds],
          equipmentIds: [...equipIds],
          instructions,
        },
        { headers }
      );
      const created = res.data?.data?.result;
      if (created) {
        onExerciseCreated?.(created);
        // Reset and select it straight away — you made it because you want to use it now.
        resetCreateForm();
        handleSelect(created);
      }
    } catch (err) {
      console.error('Error creating exercise:', err);
      setCreateError('Could not create the exercise. Try again.');
    } finally {
      setSavingNew(false);
    }
  };

  const handleDeleteCustom = async (ex, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete your exercise "${ex.name}"? This can't be undone.`)) return;
    try {
      const headers = { Authorization: `Bearer ${await getToken()}` };
      await api.delete(`/exercise-log/exercise/${ex.id}`, { headers });
      onExerciseDeleted?.(ex.id);
    } catch (err) {
      console.error('Error deleting exercise:', err);
    }
  };

  const renderRow = (ex) => {
    const fav = favoriteIds.has(ex.id);
    const expanded = expandedId === ex.id;
    const det = details[ex.id];
    return (
      <div
        key={ex.id}
        className={`mb-2 rounded-lg border transition-colors ${
          ex.id === selectedId ? 'border-clay bg-clay-tint' : 'border-line hover:border-clay'
        }`}
      >
        <div className="flex items-center gap-2.5 px-3.5 py-2.5">
          {ex.images && ex.images.length > 0 ? (
            <img
              src={`${IMG_CDN}${ex.images[0]}`}
              alt=""
              loading="lazy"
              onClick={() => handleSelect(ex)}
              className="h-11 w-11 flex-shrink-0 cursor-pointer rounded-lg border border-line bg-surface-2 object-cover"
            />
          ) : (
            <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-lg bg-surface-2 text-muted">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6.5 6.5 11 11" /><path d="m21 21-1-1" /><path d="m3 3 1 1" /><path d="m18 22 4-4" /><path d="m2 6 4-4" /><path d="m3 10 7-7" /><path d="m14 21 7-7" /></svg>
            </div>
          )}
          <div onClick={() => handleSelect(ex)} className="min-w-0 flex-1 cursor-pointer">
            <div className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
              <span className="truncate">{ex.name}</span>
              {ex.createdBy && (
                <span className="flex-shrink-0 rounded bg-clay-tint px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-clay">
                  Mine
                </span>
              )}
            </div>
            {!isCardio && ex.TargetMuscles && ex.TargetMuscles.length > 0 && (
              <div className="mt-0.5 text-xs">
                {[...ex.TargetMuscles]
                  .sort(
                    (a, b) =>
                      (b.ExerciseTargetMuscle?.isPrimary ? 1 : 0) -
                      (a.ExerciseTargetMuscle?.isPrimary ? 1 : 0)
                  )
                  .map((m, i) => (
                    <span
                      key={m.id}
                      className={m.ExerciseTargetMuscle?.isPrimary ? 'font-semibold text-muted' : 'text-muted/60'}
                    >
                      {i > 0 ? ', ' : ''}
                      {m.name}
                    </span>
                  ))}
              </div>
            )}
          </div>
          {ex.createdBy && (
            <button
              type="button"
              aria-label="Delete exercise"
              title="Delete exercise"
              onClick={(e) => handleDeleteCustom(ex, e)}
              className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-line-strong transition-colors hover:bg-surface-2 hover:text-danger"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            </button>
          )}
          <button
            type="button"
            aria-label="Show details"
            title="Details"
            onClick={(e) => {
              e.stopPropagation();
              toggleDetails(ex.id);
            }}
            className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-clay ${
              expanded ? 'text-clay' : ''
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
            title={fav ? 'Remove from favorites' : 'Add to favorites'}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(ex.id);
            }}
            className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg transition-colors ${
              fav ? 'text-clay hover:bg-clay-tint' : 'text-line-strong hover:bg-surface-2 hover:text-clay'
            }`}
          >
            <StarIcon filled={fav} />
          </button>
        </div>

        {expanded && (
          <div className="border-t border-line px-3.5 py-3">
            <ExerciseDetail detail={det} />
          </div>
        )}
      </div>
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-[rgba(28,26,23,0.45)] p-4"
      onClick={onClose}
    >
      <Card
        className="flex max-h-[85vh] w-full min-w-0 max-w-lg flex-col overflow-hidden p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg">{isCardio ? 'Select a cardio exercise' : 'Select an exercise'}</h2>
          <button
            className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-danger"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex flex-col gap-3">
          <div className="flex rounded-xl border border-line-strong bg-surface-2 p-1">
            {[
              { v: 'all', label: 'All' },
              { v: 'favorites', label: 'Favorites' },
            ].map(({ v, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`flex-1 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                  view === v ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder={isCardio ? 'Search cardio...' : 'Search exercises...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass}
          />
          {!isCardio && (
            <select
              value={selectedMuscle}
              onChange={(e) => setSelectedMuscle(e.target.value)}
              className={inputClass}
            >
              <option value="">All Target Muscles</option>
              {allTargetMuscles.map((muscle) => (
                <option key={muscle.id} value={muscle.name}>
                  {muscle.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {!creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-strong py-2.5 text-sm font-semibold text-muted transition-colors hover:border-clay hover:text-clay"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
            Create new {isCardio ? 'cardio' : 'exercise'}
          </button>
        ) : (
          <div className="mb-3 rounded-xl border border-line-strong bg-surface-2 p-3.5">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
              New {isCardio ? 'cardio' : 'exercise'} (only you can see it)
            </div>
            <input
              type="text"
              autoFocus
              placeholder="Name (e.g. Cable Y-Raise)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className={inputClass}
            />
            {!isCardio && taxonomy.muscles.length > 0 && (
              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
                  <span>Target muscles (optional)</span>
                  <span className="text-[10px]">tap: off → primary → secondary</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {taxonomy.muscles.map((m) => {
                    const isP = primaryIds.has(m.id);
                    const isS = secondaryIds.has(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => cycleMuscle(m.id)}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                          isP
                            ? 'border-clay bg-clay text-white'
                            : isS
                            ? 'border-clay bg-clay-tint text-clay'
                            : 'border-line text-muted hover:border-clay'
                        }`}
                      >
                        {m.name}
                        {isP && ' · primary'}
                        {isS && ' · secondary'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {taxonomy.equipment.length > 0 && (
              <div className="mt-3">
                <div className="mb-1.5 text-xs text-muted">Equipment (optional)</div>
                <div className="flex flex-wrap gap-1.5">
                  {taxonomy.equipment.map((eq) => (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => toggleEquip(eq.id)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                        equipIds.has(eq.id)
                          ? 'border-clay bg-clay-tint text-clay'
                          : 'border-line text-muted hover:border-clay'
                      }`}
                    >
                      {eq.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-3">
              <div className="mb-1.5 text-xs text-muted">Instructions (optional)</div>
              <div className="flex flex-col gap-1.5">
                {newSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-surface text-xs font-semibold text-muted">
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      placeholder={`Step ${i + 1}`}
                      value={step}
                      onChange={(e) => updateStep(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && step.trim() && i === newSteps.length - 1) addStep();
                      }}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      aria-label="Remove step"
                      onClick={() => removeStep(i)}
                      className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-danger"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addStep}
                className="mt-1.5 text-xs font-semibold text-clay hover:underline"
              >
                + Add step
              </button>
            </div>
            {createError && <p className="mt-2 text-xs text-danger">{createError}</p>}
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={resetCreateForm}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={savingNew || !newName.trim()}
                className="rounded-lg bg-clay px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-clay/90 disabled:opacity-50"
              >
                {savingNew ? 'Creating…' : 'Create & add'}
              </button>
            </div>
          </div>
        )}

        <div className="-mx-1 flex-1 overflow-y-auto px-1">
          {view === 'all' && favoritesList.length > 0 && (
            <div>
              <div className="sticky top-0 z-10 flex items-center gap-1 bg-surface py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-clay">
                <StarIcon filled />
                Favorites
              </div>
              {favoritesList.map(renderRow)}
            </div>
          )}
          {letterGroups.map((group) => (
            <div key={group.letter}>
              <div className="sticky top-0 z-10 bg-surface py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                {group.letter}
              </div>
              {group.items.map(renderRow)}
            </div>
          ))}
          {view === 'favorites' && favoritesList.length === 0 && (
            <div className="py-8 text-center text-sm text-muted">
              No favorites yet — tap the ☆ on an exercise to add one.
            </div>
          )}
          {view === 'all' && favoritesList.length === 0 && nonFavorites.length === 0 && (
            <div className="py-8 text-center text-sm text-muted">No exercises found.</div>
          )}
        </div>
      </Card>
    </div>,
    document.body
  );
}

export default ExercisePickerModal;
