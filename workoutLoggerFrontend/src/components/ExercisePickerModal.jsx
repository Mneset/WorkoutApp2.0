import React, { useState, useEffect } from 'react';
import Card from './Card';

const inputClass =
  'w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm focus:border-clay focus:outline-none focus:ring-[3px] focus:ring-clay-tint';

// `type` scopes the list: 'strength' (the default) or 'cardio' — each has its own picker.
function ExercisePickerModal({ exercises = [], onSelect, onClose, type = 'strength' }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedMuscle, setSelectedMuscle] = useState('');

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const isCardio = type === 'cardio';
  const ofType = exercises.filter((ex) => (ex.type === 'cardio' ? 'cardio' : 'strength') === type);

  const filteredExercises = ofType.filter((ex) => {
    const matchesName = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle =
      selectedMuscle === '' ||
      (ex.TargetMuscles &&
        ex.TargetMuscles.some((muscle) => muscle.name.toLowerCase() === selectedMuscle.toLowerCase()));
    return matchesName && matchesMuscle;
  });

  // Target muscles present in this picker's exercises (strength only uses the filter).
  const allTargetMuscles = ofType.reduce((muscles, ex) => {
    if (ex.TargetMuscles) {
      ex.TargetMuscles.forEach((muscle) => {
        if (!muscles.some((m) => m.name === muscle.name)) muscles.push(muscle);
      });
    }
    return muscles;
  }, []);

  // Sort A→Z and group by first letter (non-letters bucket under "#") so the now-large
  // list reads as an alphabetised index with sticky letter headers.
  const letterGroups = (() => {
    const sorted = [...filteredExercises].sort((a, b) =>
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
    // Non-letter names ("#") sort before letters — move that group to the end instead.
    const hashIndex = groups.findIndex((g) => g.letter === '#');
    if (hashIndex > -1) groups.push(groups.splice(hashIndex, 1)[0]);
    return groups;
  })();

  const handleSelect = (ex) => {
    setSelectedId(ex.id);
    onSelect(ex);
    onClose();
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
          {letterGroups.map((group) => (
            <div key={group.letter}>
              <div className="sticky top-0 z-10 bg-surface py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                {group.letter}
              </div>
              {group.items.map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => handleSelect(ex)}
                  className={`mb-2 cursor-pointer rounded-lg border px-3.5 py-2.5 hover:border-clay hover:bg-clay-tint ${
                    ex.id === selectedId ? 'border-clay bg-clay-tint' : 'border-line'
                  }`}
                >
                  <div className="text-sm font-medium">{ex.name}</div>
                  {!isCardio && ex.TargetMuscles && ex.TargetMuscles.length > 0 && (
                    <div className="mt-0.5 text-xs text-muted">
                      {ex.TargetMuscles.map((m) => m.name).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
          {filteredExercises.length === 0 && (
            <div className="py-8 text-center text-sm text-muted">No exercises found.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default ExercisePickerModal;
