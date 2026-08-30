const express = require('express');
const router = express.Router();
const db = require('../models');
const SessionTemplateService = require('../services/sessionTemplateService');
const sessionTemplateService = new SessionTemplateService(db);
const WorkoutPlanService = require('../services/workoutPlanService');
const workoutPlanService = new WorkoutPlanService(db);
const checkForUser = require('../utils/userCreator');
const { validate } = require('../middleware/validate');
const { createSessionTemplateSchema, updateSessionTemplateSchema } = require('../schemas/sessionTemplateSchemas');
const { success, error } = require('../utils/response');

if (process.env.NODE_ENV !== 'test') {
    router.use(checkForUser);
}

router.get('/', async (req, res) => {
    try {
        const templates = await sessionTemplateService.getAllTemplates();
        return success(res, templates);
    } catch (err) {
        console.error('Error fetching session templates:', err);
        return error(res, 'Failed to fetch session templates');
    }
});

// Standalone (non-plan) templates owned by a user. Must precede '/:id'.
router.get('/standalone', async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return error(res, 'userId is required', 400);
    }
    try {
        const templates = await sessionTemplateService.getStandaloneTemplatesByUser(userId);
        return success(res, templates);
    } catch (err) {
        console.error('Error fetching standalone templates:', err);
        return error(res, 'Failed to fetch standalone templates');
    }
});

// Exercises in this template that need a 1RM (prescribed by %) but don't have one yet.
router.get('/:id/missing-one-rep-max', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return error(res, 'userId is required', 400);
    try {
        const missing = await sessionTemplateService.getMissingOneRepMax(req.params.id, userId);
        return success(res, missing);
    } catch (err) {
        console.error('Error checking missing 1RMs:', err);
        return error(res, 'Failed to check 1RMs');
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const template = await sessionTemplateService.getTemplateById(id);
        if (!template) {
            return error(res, 'Session template not found', 404);
        }
        return success(res, template);
    } catch (err) {
        console.error('Error fetching session template:', err);
        return error(res, 'Failed to fetch session template');
    }
});

router.post('/', validate(createSessionTemplateSchema), async (req, res) => {
    const { name, dayOffset, workoutPlanId, userId, notes } = req.body;
    try {
        // Plan templates must reference an existing plan; standalone templates skip this.
        if (workoutPlanId) {
            const workoutPlan = await workoutPlanService.getWorkoutPlanById(workoutPlanId);
            if (!workoutPlan) {
                return error(res, 'Workout plan not found', 404);
            }
        } else if (!userId) {
            return error(res, 'A template needs either a workoutPlanId or a userId', 400);
        }

        const session = await sessionTemplateService.createTemplate(name, dayOffset, workoutPlanId ?? null, notes ?? null, userId ?? null);
        return success(res, session, 201);
    } catch (err) {
        console.error('Error creating session template:', err);
        return error(res, 'Failed to create session template');
    }
});

router.put('/:id', validate(updateSessionTemplateSchema), async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    try {
        if (updateData.workoutPlanId) {
            const workoutPlan = await workoutPlanService.getWorkoutPlanById(updateData.workoutPlanId);
            if (!workoutPlan) {
                return error(res, 'Workout plan not found', 404);
            }
        }

        const affectedRows = await sessionTemplateService.updateTemplate(id, updateData);
        if (affectedRows === 0) {
            return error(res, 'Session template not found', 404);
        }

        return success(res, 'Session template updated successfully');
    } catch (err) {
        console.error('Error updating session template:', err);
        return error(res, 'Failed to update session template');
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedRows = await sessionTemplateService.deleteTemplate(id);
        if (deletedRows === 0) {
            return error(res, 'Session template not found', 404);
        }

        return success(res, 'Session template deleted successfully');
    } catch (err) {
        console.error('Error deleting session template:', err);
        return error(res, 'Failed to delete session template');
    }
});

module.exports = router;
