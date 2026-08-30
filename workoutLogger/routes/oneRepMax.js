const express = require('express');
const router = express.Router();
const db = require('../models');
const OneRepMaxService = require('../services/oneRepMaxService');
const oneRepMaxService = new OneRepMaxService(db);
const checkForUser = require('../utils/userCreator');
const { validate } = require('../middleware/validate');
const { upsertOneRepMaxSchema } = require('../schemas/oneRepMaxSchemas');
const { success, error } = require('../utils/response');

if (process.env.NODE_ENV !== 'test') {
    router.use(checkForUser);
}

// A user's saved 1RMs.
router.get('/', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return error(res, 'userId is required', 400);
    try {
        const rows = await oneRepMaxService.getByUser(userId);
        return success(res, rows);
    } catch (err) {
        console.error('Error fetching 1RMs:', err);
        return error(res, 'Failed to fetch 1RMs');
    }
});

// Estimated 1RM from the user's logged history for one exercise (nullable).
router.get('/estimate', async (req, res) => {
    const { userId, exerciseId } = req.query;
    if (!userId || !exerciseId) return error(res, 'userId and exerciseId are required', 400);
    try {
        const estimate = await oneRepMaxService.estimateFromHistory(userId, Number(exerciseId));
        return success(res, { estimate });
    } catch (err) {
        console.error('Error estimating 1RM:', err);
        return error(res, 'Failed to estimate 1RM');
    }
});

// Create or update a 1RM.
router.put('/', validate(upsertOneRepMaxSchema), async (req, res) => {
    const { userId, exerciseId, oneRm } = req.body;
    try {
        const row = await oneRepMaxService.upsert(userId, exerciseId, oneRm);
        return success(res, row);
    } catch (err) {
        console.error('Error saving 1RM:', err);
        return error(res, 'Failed to save 1RM');
    }
});

router.delete('/:exerciseId', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return error(res, 'userId is required', 400);
    try {
        await oneRepMaxService.remove(userId, Number(req.params.exerciseId));
        return success(res, 'Deleted');
    } catch (err) {
        console.error('Error deleting 1RM:', err);
        return error(res, 'Failed to delete 1RM');
    }
});

module.exports = router;
