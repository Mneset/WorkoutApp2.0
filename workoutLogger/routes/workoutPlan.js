const express = require('express');
const router = express.Router();
const db = require('../models');
const WorkoutPlanService = require('../services/workoutPlanService');
const workoutPlanService = new WorkoutPlanService(db);
const checkForUser = require('../utils/userCreator');
const { validate } = require('../middleware/validate');
const { createWorkoutPlanSchema, updateWorkoutPlanSchema } = require('../schemas/workoutPlanSchemas');
const { success, error } = require('../utils/response');

if (process.env.NODE_ENV !== 'test') {
    router.use(checkForUser);
}

router.get('/', async (req, res) => {
    try {
        const plans = await workoutPlanService.getAllWorkoutPlans();

        if (!plans || plans.length === 0) {
            return error(res, 'No workout plans found', 404);
        }

        return success(res, plans);
    } catch (err) {
        console.error('Error fetching workout plans:', err);
        return error(res, 'Failed to fetch workout plans');
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const plan = await workoutPlanService.getWorkoutPlanById(id);

        if (!plan) {
            return error(res, 'No workout plan found', 404);
        }

        return success(res, plan);
    } catch (err) {
        console.error('Error fetching workout plan:', err);
        return error(res, 'Failed to fetch workout plan');
    }
});

router.post('/', validate(createWorkoutPlanSchema), async (req, res) => {
    const { name, description, durationWeeks } = req.body;
    try {
        const plan = await workoutPlanService.createWorkoutPlan(name, description, durationWeeks);
        return success(res, plan, 201);
    } catch (err) {
        console.error('Error creating workout plan:', err);
        return error(res, 'Failed to create workout plan');
    }
});

router.put('/:id', validate(updateWorkoutPlanSchema), async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    try {
        const affectedRows = await workoutPlanService.updateWorkoutPlan(id, updateData);

        if (affectedRows === 0) {
            return error(res, 'No workout plan found', 404);
        }

        return success(res, 'Workout plan updated successfully');
    } catch (err) {
        console.error('Error updating workout plan:', err);
        return error(res, 'Failed to update workout plan');
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedRows = await workoutPlanService.deleteWorkoutPlan(id);

        if (deletedRows === 0) {
            return error(res, 'No workout plan found', 404);
        }

        return success(res, 'Workout plan deleted successfully');
    } catch (err) {
        console.error('Error deleting workout plan:', err);
        return error(res, 'Failed to delete workout plan');
    }
});

module.exports = router;
