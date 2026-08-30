const express = require('express');
const router = express.Router();
const db = require('../models');
const FavoriteExerciseService = require('../services/favoriteExerciseService');
const favoriteExerciseService = new FavoriteExerciseService(db);
const checkForUser = require('../utils/userCreator');
const { success, error } = require('../utils/response');

if (process.env.NODE_ENV !== 'test') {
    router.use(checkForUser);
}

// The signed-in user's favorite exercise ids.
router.get('/', async (req, res) => {
    const userId = req.auth?.payload?.sub || req.query.userId;
    if (!userId) return error(res, 'userId is required', 400);
    try {
        const ids = await favoriteExerciseService.getByUser(userId);
        return success(res, ids);
    } catch (err) {
        console.error('Error fetching favorites:', err);
        return error(res, 'Failed to fetch favorites');
    }
});

router.post('/', async (req, res) => {
    const userId = req.auth?.payload?.sub || req.body.userId;
    const { exerciseId } = req.body;
    if (!userId || !exerciseId) return error(res, 'userId and exerciseId are required', 400);
    try {
        await favoriteExerciseService.add(userId, Number(exerciseId));
        return success(res, 'Added', 201);
    } catch (err) {
        console.error('Error adding favorite:', err);
        return error(res, 'Failed to add favorite');
    }
});

router.delete('/:exerciseId', async (req, res) => {
    const userId = req.auth?.payload?.sub || req.query.userId;
    if (!userId) return error(res, 'userId is required', 400);
    try {
        await favoriteExerciseService.remove(userId, Number(req.params.exerciseId));
        return success(res, 'Removed');
    } catch (err) {
        console.error('Error removing favorite:', err);
        return error(res, 'Failed to remove favorite');
    }
});

module.exports = router;
