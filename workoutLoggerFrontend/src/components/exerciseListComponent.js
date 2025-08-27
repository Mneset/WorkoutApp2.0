import React, { useState, useEffect } from 'react'

function ExerciseListComponent ( { exercises = [], onSelect, onClose}) {

    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [selectedMuscle, setSelectedMuscle] = useState('');

     useEffect(() => {
        document.body.classList.add('modal-open');
        
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, []);

   const filteredExercises = exercises.filter(ex => {
        const matchesName = ex.name.toLowerCase().includes(search.toLowerCase());
        
        const matchesMuscle = selectedMuscle === '' || 
            (ex.TargetMuscles && ex.TargetMuscles.some(muscle => 
                muscle.name.toLowerCase() === selectedMuscle.toLowerCase()
            ));
        
        return matchesName && matchesMuscle;
    });

    // Get unique target muscles for the dropdown
    const allTargetMuscles = exercises.reduce((muscles, ex) => {
        if (ex.TargetMuscles) {
            ex.TargetMuscles.forEach(muscle => {
                if (!muscles.some(m => m.name === muscle.name)) {
                    muscles.push(muscle);
                }
            });
        }
        return muscles;
    }, []);

    const handleConfirm = () => {
        const selectedExercise = exercises.find(ex => ex.id === selectedId);
        if (selectedExercise) {
            onSelect(selectedExercise);
            onClose()
        }
    };

    return (
        <div id='exercise-list-container'> 
            <div className="overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <button className="close-btn" onClick={onClose}>×</button>
                    </div>
                    <div className="search-filters">
                        <h3 className='modal-heading'>Select an Exercise</h3>
                        <input
                            type="text"
                            placeholder="Search exercises..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <select
                            value={selectedMuscle}
                            onChange={e => setSelectedMuscle(e.target.value)}
                            className="muscle-filter"
                        >
                            <option value="">All Target Muscles</option>
                            {allTargetMuscles.map(muscle => (
                                <option key={muscle.id} value={muscle.name}>
                                    {muscle.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <table className='exercise-list-table'>
                        <thead>
                            <tr>
                                <th>Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExercises.map(ex => (
                                <tr key={ex.id} 
                                onClick={() => setSelectedId(ex.id)}
                                className={`exercise-row ${ex.id === selectedId ? 'selected' : ''}`}
                                style={{
                                    cursor: 'pointer'
                                }}
                                >
                                    <td className='exercise-list-td'>
                                        <span>{ex.name}</span>
                                        {ex.id === selectedId  && (
                                            <button
                                                className="add-btn-2"
                                                onClick={handleConfirm}
                                                disabled={!selectedId}
                                            >
                                                Add +
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredExercises.length === 0 && (
                                <tr>
                                    <td colSpan="2">No exercises found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                     
                </div>
            </div> 
        </div>
    )
}

export default ExerciseListComponent;