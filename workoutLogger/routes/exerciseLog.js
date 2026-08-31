const express = require('express');
const router = express.Router();
const db = require('../models');
const ExerciseLogService = require('../services/exerciseLogService');
const exerciseLogService = new ExerciseLogService(db);
const ExerciseService = require('../services/exerciseService');
const exerciseService = new ExerciseService(db);
const checkForUser = require('../utils/userCreator');
const { validate } = require('../middleware/validate');
const { createExerciseLogSchema, updateExerciseLogSchema, createExerciseSchema } = require('../schemas/exerciseLogSchemas');
const { success, error } = require('../utils/response');

router.use(checkForUser);

router.post('/', validate(createExerciseLogSchema), async (req, res) => {
    const { exerciseId, setId, reps, weight, durationSeconds, distance, orderIndex, notes, rpe, rir, targetReps, targetWeight, targetWeightPct, targetDurationSeconds, targetDistance, sessionLogId } = req.body;
    try {
        const exerciseLog = await exerciseLogService.addExerciseLogToSession({
            exerciseId, setId, reps, weight, durationSeconds, distance, orderIndex, notes, rpe, rir, targetReps, targetWeight, targetWeightPct, targetDurationSeconds, targetDistance, sessionLogId,
        });
        return success(res, exerciseLog, 201);
    } catch (err) {
        console.error(err);
        return error(res, 'Failed to add exerciseLog');
    }
});

router.put('/:id', validate(updateExerciseLogSchema), async (req, res) => {
    const { reps, weight, durationSeconds, distance, orderIndex, notes, rpe, rir } = req.body;
    const exerciseLogId = req.params.id;
    try {
        const updatedExerciseLog = await exerciseLogService.updateExerciseLog(exerciseLogId, {
            reps, weight, durationSeconds, distance, orderIndex, notes, rpe, rir,
        });
        return success(res, updatedExerciseLog);
    } catch (err) {
        console.error(err);
        return error(res, 'Failed to update exercise log');
    }
});

router.get('/', async (req, res) => {
    try {
        const userId = req.auth?.payload?.sub || req.query.userId;
        const exercises = await exerciseService.getAllExercises(userId);
        return success(res, exercises);
    } catch (err) {
        console.error(err);
        return error(res, 'Failed to get exercises');
    }
});

// Equipment + target-muscle taxonomy for the custom-exercise create form.
router.get('/taxonomy', async (req, res) => {
    try {
        const taxonomy = await exerciseService.getTaxonomy();
        return success(res, taxonomy);
    } catch (err) {
        console.error('Error fetching taxonomy:', err);
        return error(res, 'Failed to get taxonomy');
    }
});

// Create a custom exercise owned by the requesting user (private to them).
router.post('/exercise', validate(createExerciseSchema), async (req, res) => {
    const userId = req.auth?.payload?.sub || req.body.userId;
    if (!userId) return error(res, 'userId is required', 400);
    const { name, type, primaryMuscleIds, secondaryMuscleIds, equipmentIds, instructions } = req.body;
    try {
        const exercise = await exerciseService.createExercise({
            name, type, createdBy: userId, primaryMuscleIds, secondaryMuscleIds, equipmentIds, instructions,
        });
        return success(res, exercise, 201);
    } catch (err) {
        console.error('Error creating exercise:', err);
        return error(res, 'Failed to create exercise');
    }
});

// Delete one of the user's own custom exercises (library exercises are protected).
router.delete('/exercise/:id', async (req, res) => {
    const userId = req.auth?.payload?.sub || req.query.userId;
    try {
        const deleted = await exerciseService.deleteCustomExercise(Number(req.params.id), userId);
        if (!deleted) return error(res, 'Exercise not found or not yours to delete', 404);
        return success(res, 'Exercise deleted successfully');
    } catch (err) {
        console.error('Error deleting exercise:', err);
        return error(res, 'Failed to delete exercise');
    }
});

// Lazy-loaded instructions + image paths for one exercise (for the picker's detail view).
router.get('/details/:id', async (req, res) => {
    try {
        const details = await exerciseService.getExerciseDetails(req.params.id);
        if (!details) return error(res, 'Exercise not found', 404);
        return success(res, details);
    } catch (err) {
        console.error('Error fetching exercise details:', err);
        return error(res, 'Failed to get exercise details');
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
