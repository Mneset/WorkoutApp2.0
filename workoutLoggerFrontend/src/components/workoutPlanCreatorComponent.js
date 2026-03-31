import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function WorkoutPlanCreatorComponent() {
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
        setSessionTemplates(prev => [...prev, {
            tempId: Date.now(),
            name: '',
            dayOffset: prev.length,
            exercises: []
        }]);
    };

    const removeSessionTemplate = (tempId) => {
        setSessionTemplates(prev => prev.filter(s => s.tempId !== tempId));
    };

    const updateSessionTemplate = (tempId, field, value) => {
        setSessionTemplates(prev => prev.map(s =>
            s.tempId === tempId ? { ...s, [field]: value } : s
        ));
    };

    const addExerciseToTemplate = (templateTempId) => {
        setSessionTemplates(prev => prev.map(s => {
            if (s.tempId !== templateTempId) return s;
            return {
                ...s,
                exercises: [...s.exercises, {
                    tempId: Date.now(),
                    exerciseId: exercises.length > 0 ? exercises[0].id : '',
                    baseSets: 3,
                    baseReps: 10,
                    baseWeight: 0
                }]
            };
        }));
    };

    const removeExerciseFromTemplate = (templateTempId, exerciseTempId) => {
        setSessionTemplates(prev => prev.map(s => {
            if (s.tempId !== templateTempId) return s;
            return {
                ...s,
                exercises: s.exercises.filter(e => e.tempId !== exerciseTempId)
            };
        }));
    };

    const updateExerciseInTemplate = (templateTempId, exerciseTempId, field, value) => {
        setSessionTemplates(prev => prev.map(s => {
            if (s.tempId !== templateTempId) return s;
            return {
                ...s,
                exercises: s.exercises.map(e =>
                    e.tempId === exerciseTempId ? { ...e, [field]: value } : e
                )
            };
        }));
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
        }

        setSaving(true);
        setError(null);

        try {
            const accessToken = await getToken();
            const headers = { Authorization: `Bearer ${accessToken}` };

            // 1. Create the workout plan
            const planResponse = await api.post('/workout-plan', {
                name: name.trim(),
                description: description.trim(),
                durationWeeks: Number(durationWeeks)
            }, { headers });

            const plan = planResponse.data.data.result;

            // 2. Create session templates
            for (let i = 0; i < sessionTemplates.length; i++) {
                const st = sessionTemplates[i];
                const stResponse = await api.post('/session-template', {
                    name: st.name.trim(),
                    dayOffset: Number(st.dayOffset),
                    workoutPlanId: plan.id
                }, { headers });

                const sessionTemplate = stResponse.data.data.result;

                // 3. Create exercise templates for each session
                for (let j = 0; j < st.exercises.length; j++) {
                    const ex = st.exercises[j];
                    await api.post('/exercise-template', {
                        sessionTemplateId: sessionTemplate.id,
                        exerciseId: Number(ex.exerciseId),
                        orderIndex: j,
                        baseSets: Number(ex.baseSets),
                        baseReps: Number(ex.baseReps),
                        baseWeight: Number(ex.baseWeight) || null
                    }, { headers });
                }
            }

            navigate('/workout-plan/select-plan');
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
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="plan-creator">
            <h1>Create a Workout Plan</h1>

            <div className="plan-creator-form">
                <input
                    type="text"
                    placeholder="Plan name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <textarea
                    placeholder="Description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
                <label>Duration (weeks)</label>
                <input
                    type="number"
                    min="1"
                    value={durationWeeks}
                    onChange={e => setDurationWeeks(e.target.value)}
                />
            </div>

            <h2>Sessions</h2>

            <div className="session-templates-list">
                {sessionTemplates.map((st) => (
                    <div key={st.tempId} className="session-template-card">
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                            <input
                                type="text"
                                placeholder="Session name (e.g. Push Day)"
                                value={st.name}
                                onChange={e => updateSessionTemplate(st.tempId, 'name', e.target.value)}
                                style={{flex: 1, marginRight: '8px', marginBottom: 0}}
                            />
                            <button
                                className="remove-btn"
                                onClick={() => removeSessionTemplate(st.tempId)}
                            >
                                Remove
                            </button>
                        </div>

                        <label>Day</label>
                        <select
                            value={st.dayOffset}
                            onChange={e => updateSessionTemplate(st.tempId, 'dayOffset', Number(e.target.value))}
                            style={{
                                width: '100%', padding: '10px', marginBottom: '12px',
                                background: 'rgba(255,255,255,0.05)', color: 'white',
                                border: '1px solid #444', borderRadius: '4px', fontSize: '16px'
                            }}
                        >
                            {DAYS.map((day, i) => (
                                <option key={i} value={i}>{day}</option>
                            ))}
                        </select>

                        <div className="session-template-exercises">
                            <h4 style={{padding: '4px 0'}}>Exercises</h4>
                            {st.exercises.map((ex) => (
                                <div key={ex.tempId} className="exercise-template-row">
                                    <select
                                        value={ex.exerciseId}
                                        onChange={e => updateExerciseInTemplate(st.tempId, ex.tempId, 'exerciseId', e.target.value)}
                                    >
                                        {exercises.map(exercise => (
                                            <option key={exercise.id} value={exercise.id}>
                                                {exercise.name}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Sets"
                                        value={ex.baseSets}
                                        onChange={e => updateExerciseInTemplate(st.tempId, ex.tempId, 'baseSets', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Reps"
                                        value={ex.baseReps}
                                        onChange={e => updateExerciseInTemplate(st.tempId, ex.tempId, 'baseReps', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Weight"
                                        value={ex.baseWeight}
                                        onChange={e => updateExerciseInTemplate(st.tempId, ex.tempId, 'baseWeight', e.target.value)}
                                    />
                                    <button
                                        className="remove-btn"
                                        onClick={() => removeExerciseFromTemplate(st.tempId, ex.tempId)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <button
                                className="add-exercise-to-template-btn"
                                onClick={() => addExerciseToTemplate(st.tempId)}
                            >
                                + Add Exercise
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button className="add-template-btn" onClick={addSessionTemplate}>
                + Add Session Day
            </button>

            {error && (
                <div className="error-container" style={{padding: '12px'}}>
                    <p>{error}</p>
                </div>
            )}

            <button
                className="save-plan-btn"
                onClick={handleSave}
                disabled={saving}
            >
                {saving ? 'Creating Plan...' : 'Create Plan'}
            </button>
        </div>
    );
}

export default WorkoutPlanCreatorComponent;
