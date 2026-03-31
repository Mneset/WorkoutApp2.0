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
    const { name, dayOffset, workoutPlanId } = req.body;
    try {
        const workoutPlan = await workoutPlanService.getWorkoutPlanById(workoutPlanId);
        if (!workoutPlan) {
            return error(res, 'Workout plan not found', 404);
        }

        const session = await sessionTemplateService.createTemplate(name, dayOffset, workoutPlanId);
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
