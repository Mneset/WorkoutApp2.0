const express = require('express');
const router = express.Router();
const db = require('../models');
const ExerciseLogService = require('../services/exerciseLogService');
const exerciseLogService = new ExerciseLogService(db);
const ExerciseService = require('../services/exerciseService');
const exerciseService = new ExerciseService(db);
const checkForUser = require('../utils/userCreator');
const { validate } = require('../middleware/validate');
const { createExerciseLogSchema, updateExerciseLogSchema } = require('../schemas/exerciseLogSchemas');
const { success, error } = require('../utils/response');

router.use(checkForUser);

router.post('/', validate(createExerciseLogSchema), async (req, res) => {
    const { exerciseId, setId, reps, weight, notes, sessionLogId } = req.body;
    try {
        const exerciseLog = await exerciseLogService.addExerciseLogToSession(exerciseId, setId, reps, weight, notes, sessionLogId);
        return success(res, exerciseLog, 201);
    } catch (err) {
        console.error(err);
        return error(res, 'Failed to add exerciseLog');
    }
});

router.put('/:id', validate(updateExerciseLogSchema), async (req, res) => {
    const { reps, weight, notes } = req.body;
    const exerciseLogId = req.params.id;
    try {
        const updatedExerciseLog = await exerciseLogService.updateExerciseLog(exerciseLogId, reps, weight, notes);
        return success(res, updatedExerciseLog);
    } catch (err) {
        console.error(err);
        return error(res, 'Failed to update exercise log');
    }
});

router.get('/', async (req, res) => {
    try {
        const exercises = await exerciseService.getAllExercises();
        return success(res, exercises);
    } catch (err) {
        console.error(err);
        return error(res, 'Failed to get exercises');
    }
});

router.delete('/:id', async (req, res) => {
    const exerciseLogId = req.params.id;
    try {
        const deleted = await exerciseLogService.deleteExerciseLog(exerciseLogId);
        if (!deleted) {
            return error(res, 'Exercise log not found', 404);
        }
        return success(res, 'Exercise log deleted successfully');
    } catch (err) {
        console.error(err);
        return error(res, 'Failed to delete exercise log');
    }
});

module.exports = router;
