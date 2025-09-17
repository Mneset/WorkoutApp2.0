const express = require('express');
const router = express.Router();
const db = require('../models');
const createError = require('http-errors')
const WorkoutPlanService = require('../services/workoutPlanService');
const workoutPlanService = new WorkoutPlanService(db);
const checkForUser = require('../utils/userCreator');

router.use(checkForUser);

router.get('/', async (req, res) => {

});

router.post('/', async (req, res) => {
    const { name, description, durationWeeks } = req.body;
    try {
        if(!name || !description || !durationWeeks) {
            next(createError(400, 'Missing required fields: name, description, or durationWeeks'))
        }

        await workoutPlanService.createWorkoutPlan(name, description, durationWeeks);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            data: {
                result: 'Workout plan created successfully'

            }
        })


        
    } catch (error) {
        console.error('Error creating workout plan:', error);
        next(createError(error))
    }

});

module.exports = router;