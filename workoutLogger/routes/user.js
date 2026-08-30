const express = require('express');
const router = express.Router();
const db = require('../models');
const WorkoutPlanService = require('../services/workoutPlanService');
const workoutPlanService = new WorkoutPlanService(db);
const UserService = require('../services/userService');
const userService = new UserService(db);
const checkForUser = require('../utils/userCreator');
const { validate } = require('../middleware/validate');
const { startPlanSchema, updateProfileSchema } = require('../schemas/userSchemas');
const { success, error } = require('../utils/response');

if (process.env.NODE_ENV !== 'test') {
    router.use(checkForUser);
}

// Update the signed-in user's editable profile (display name, preferences).
router.put('/profile', validate(updateProfileSchema), async (req, res) => {
    const userId = req.auth?.payload.sub;
    try {
        const updated = await userService.updateProfile(userId, req.body);
        if (!updated) return error(res, 'User not found', 404);
        return success(res, updated);
    } catch (err) {
        console.error('Error updating profile:', err);
        return error(res, 'Failed to update profile');
    }
});

router.get('/', async (req, res) => {
    const userId = req.auth?.payload.sub;

    try {
        const user = await userService.getUserProfile(userId);

        if (!user) {
            return error(res, 'User not found', 404);
        }

        // Returns the user with WorkoutPlan: null when no active plan (200, not 404)
        return success(res, user);
    } catch (err) {
        console.error(err);
        return error(res, 'Failed to get user info');
    }
});

router.put('/:id', validate(startPlanSchema), async (req, res) => {
    const userId = req.params.id;
    const { workoutPlanId, startDate } = req.body;
    try {
        const user = await userService.findUserById(userId);

        if (!user) {
            return error(res, 'No user found with that id', 404);
        }

        const activePlan = await userService.getCurrentPlanStatus(userId);

        if (activePlan) {
            return error(res, 'User already has an active plan. Quit current plan to start a new one', 400);
        }

        const workoutPlan = await workoutPlanService.getWorkoutPlanById(workoutPlanId);

        if (!workoutPlan) {
            return error(res, 'No workout plan found with that id', 404);
        }

        await workoutPlanService.startWorkoutPlan(userId, workoutPlanId, startDate);

        const updatedUser = await userService.getCurrentPlanStatus(userId);

        return success(res, updatedUser);
    } catch (err) {
        console.error('Error starting workout plan:', err);
        return error(res, 'Failed to start workout plan');
    }
});

router.delete('/plan', async (req, res) => {
    const userId = req.auth?.payload.sub;
    try {
        await workoutPlanService.quitWorkoutPlan(userId);
        return success(res, 'Plan ended');
    } catch (err) {
        console.error('Error quitting plan:', err);
        return error(res, 'Failed to quit plan');
    }
});

module.exports = router;
