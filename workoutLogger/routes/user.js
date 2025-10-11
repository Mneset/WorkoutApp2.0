const express = require('express');
const router = express.Router();
const db = require('../models');
const createError = require('http-errors')
const WorkoutPlanService = require('../services/workoutPlanService');
const workoutPlanService = new WorkoutPlanService(db);
const UserService = require('../services/userService')
const userService = new UserService(db)
const checkForUser = require('../utils/userCreator');

if (process.env.NODE_ENV !== 'test') {
    router.use(checkForUser);
}

router.put('/:id', async (req, res, next) => {
    const userId = req.params
    try {
        
    } catch {
        console.error('Error fetching workout plans:', error);
        next(createError(error))
    }
})

module.exports = router