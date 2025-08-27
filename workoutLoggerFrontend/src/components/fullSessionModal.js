import React, { useState, useEffect } from 'react';

function FullSessionComponent({ session, onClose }) {

     useEffect(() => {
        document.body.classList.add('modal-open');
        
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, []);

    return (
        <div id='full-session-container'> 
            <div className="overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    { session ? (
                            <div key={session.id}>
                                <div className="modal-header">
                                    <button className="close-btn" onClick={onClose}>x</button>
                                </div>
                                <h2 className="session-date">
                                    {new Date(session.sessionDateStart).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </h2>
                                <table>
                                    <thead>
                                        <tr>
                                            <th colSpan="4" style={{ fontWeight: 'bold', textAlign: 'center'}}>
                                                {session.name || 'Untitled Session'}  
                                            </th>
                                        </tr>
                                    </thead>
                                    {Array.isArray(session.ExerciseLogs) && session.ExerciseLogs.length > 0 ? (
                                        Object.entries(
                                            session.ExerciseLogs.reduce((acc, log) => {
                                                const exerciseName = log.Exercise.name;
                                                if (!acc[exerciseName]) acc[exerciseName] = [];
                                                acc[exerciseName].push(log);
                                                return acc;
                                            }, {})
                                        ).map(([exerciseName, logs]) => (
                                            <tbody key={exerciseName}>
                                                <tr>
                                                    <td colSpan="4"  className='exercise-name' style={{ fontWeight: 'bold', textAlign: 'center'}}>
                                                        {exerciseName}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>Set</td>
                                                    <td>Reps</td>
                                                    <td>Weight</td>
                                                    <td>Notes</td>
                                                </tr>
                                                {logs.map((log, index) => (
                                                    <tr key={`${session.id}-${log.exerciseId}-${index}`}>
                                                        <td>{index + 1}</td>
                                                        <td>{log.reps}</td>
                                                        <td>{log.weight}</td>
                                                        <td>{log.notes}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        ))
                                    ) : (
                                        <tbody>
                                            <tr>
                                                <td colSpan="4">No exercise logs found for this session.</td>
                                            </tr>
                                        </tbody>
                                    )}
                                </table>

                            </div>
                    ) : (
                        <div>
                            <p>No sessions found.</p>
                            <button className="close-btn" onClick={onClose}>Close</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FullSessionComponent;