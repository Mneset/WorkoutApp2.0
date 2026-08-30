import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Card from './Card';

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
function ExercisePickerModal({ exercises = [], onSelect, onClose, type = 'strength' }) {
  const { getToken } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [view, setView] = useState('all'); // 'all' | 'favorites'

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

  const favoritesList = filteredExercises.filter((ex) => favoriteIds.has(ex.id));
  const nonFavorites = filteredExercises.filter((ex) => !favoriteIds.has(ex.id));

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

  const renderRow = (ex) => {
    const fav = favoriteIds.has(ex.id);
    return (
      <div
        key={ex.id}
        className={`mb-2 flex items-center gap-2 rounded-lg border px-3.5 py-2.5 ${
          ex.id === selectedId ? 'border-clay bg-clay-tint' : 'border-line hover:border-clay hover:bg-clay-tint'
        }`}
      >
        <div onClick={() => handleSelect(ex)} className="min-w-0 flex-1 cursor-pointer">
          <div className="text-sm font-medium">{ex.name}</div>
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
    );
  };

  return (
    <div
      className="fixed inset-0 z-100 grid place-items-center bg-[rgba(28,26,23,0.45)] p-6"
      onClick={onClose}
    >
      <Card
        className="flex max-h-[85vh] w-full max-w-lg flex-col p-6"
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
          {view === 'all' && filteredExercises.length === 0 && (
            <div className="py-8 text-center text-sm text-muted">No exercises found.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default ExercisePickerModal;
