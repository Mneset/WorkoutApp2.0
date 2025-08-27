const express = require('express');
const router = express.Router();
const db = require('../models');
const ExerciseLogService = require('../services/exerciseLogService');
const exerciseLogService = new ExerciseLogService(db);
const ExerciseService = require('../services/exerciseService');
const exerciseService = new ExerciseService(db);
const checkForUser = require('../utils/userCreator');

router.use(checkForUser);

router.post('/', async (req, res) => {
    const { exerciseId, setId, reps, weight, notes, sessionLogId } = req.body;
    try {
        const exerciseLog = await exerciseLogService.addExerciseLogToSession(exerciseId, setId, reps, weight, notes, sessionLogId);
        res.status(201).json({ exerciseLog });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add exerciseLog' }); 
    }
});

router.put('/:id', async (req, res) => {
    const { reps, weight, notes } = req.body;
    const exerciseLogId = req.params.id;
    try {
        const updatedExerciseLog = await exerciseLogService.updateExerciseLog(exerciseLogId, reps, weight, notes);
        res.status(200).json({ updatedExerciseLog });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update exercise log' });
    }
});

router.get('/', async (req, res) => {
    try {
        const exercises = await exerciseService.getAllExercises()
        res.status(200).json({ exercises })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get exercises'})
    }
})

router.delete('/:id', async (req, res) => {
    const exerciseLogId = req.params.id;
    try {
        const deleted = await exerciseLogService.deleteExerciseLog(exerciseLogId);
        if (!deleted) {
            return res.status(404).json({ message: 'Exercise log not found' });
        }
        res.status(200).json({ message: 'Exercise log deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete exercise log' });
    }
});

module.exports = router;