const express = require('express'); 
const router = express.Router(); 
const db = require('../models');
const createError = require('http-errors')
const WorkoutPlanService = require('../services/workoutPlanService');
const workoutPlanService = new WorkoutPlanService(db);
const checkForUser = require('../utils/userCreator');

if (process.env.NODE_ENV !== 'test') {
    router.use(checkForUser);
}

router.get('/', async (req, res, next) => {
    try {
        const plans = await workoutPlanService.getAllWorkoutPlans();

        if (!plans || plans.length === 0) {
            return next(createError(404, 'No workout plans found'));
        }

        return res.status(200).json({
            status: 'success',
            statuscode: 200,
            data: {
                result: plans
            }
        })
    } catch (error) {
        console.error('Error fetching workout plans:', error);
        next(createError(error))
    }
});

router.get('/:id', async (req, res, next) => {
    const { id } = req.params;
    try {
        const plan = await workoutPlanService.getWorkoutPlanById(id);

        if (!plan) {
            return next(createError(404, 'No workout plan found'));
        }

        return res.status(200).json({
            status: 'success',
            statuscode: 200,
            data: {
                result: plan
            }
        })
    } catch (error) {
        console.error('Error fetching workout plans:', error);
        next(createError(error))
    }
});

router.post('/', async (req, res, next) => {
    const { name, description, durationWeeks } = req.body;
    try {
        if(!name || !description || !durationWeeks) {
            return next(createError(400, 'Missing required fields: name, description, or durationWeeks'))
        }

        await workoutPlanService.createWorkoutPlan(name, description, durationWeeks);

        return res.status(200).json({
            status: 'success',
            statuscode: 200,
            data: {
                result: 'Workout plan created successfully'

            }
        })    
    } catch (error) {
        console.error('Error creating workout plan:', error);
        next(createError(error))
    }
});

router.put('/:id', async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;
    try {    
        if(!updateData || Object.keys(updateData).length === 0) {
            return next(createError(400, 'No data provided for update'));
        }

        const affectedRows = await workoutPlanService.updateWorkoutPlan(id, updateData);

        if(affectedRows === 0) {
            return next(createError(404, 'No workout plan found'));
        }
        
        return res.status(200).json({
            status: 'success',
            statuscode: 200,
            data: {
                result: 'Workout plan updated successfully'
            }
        })    
    } catch (error) {
        console.error('Error updating workout plan:', error);
        next(createError(error))
    }
})

router.delete('/:id', async (req, res, next) => {
    const { id } = req.params;
    try {
        const deletedRows = await workoutPlanService.deleteWorkoutPlan(id);

        if(deletedRows === 0) {
            return next(createError(404, 'No workout plan found'));
        }

        return res.status(200).json({
            status: 'success',
            statuscode: 200,
            data: {
                result: 'Workout plan deleted successfully'
            }
        })
    } catch (error) {
        console.error('Error updating workout plan:', error);
        next(createError(error))
    }
})


module.exports = router;