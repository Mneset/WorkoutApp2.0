const express = require('express');
const router = express.Router();
const db = require('../models');
const ExerciseTemplateService = require('../services/exerciseTemplateService');
const exerciseTemplateService = new ExerciseTemplateService(db);
const ExerciseService = require('../services/exerciseService');
const exerciseService = new ExerciseService(db);
const SessionTemplateService = require('../services/sessionTemplateService');
const sessionTemplateService = new SessionTemplateService(db);
const checkForUser = require('../utils/userCreator');
const { validate } = require('../middleware/validate');
const { createExerciseTemplateSchema, updateExerciseTemplateSchema } = require('../schemas/exerciseTemplateSchemas');
const { success, error } = require('../utils/response');

if (process.env.NODE_ENV !== 'test') {
    router.use(checkForUser);
}

router.get('/', async (req, res) => {
    try {
        const exerciseTemplates = await exerciseTemplateService.getAllExerciseTemplates();

        if (!exerciseTemplates || exerciseTemplates.length === 0) {
            return error(res, 'No exercise templates found', 404);
        }

        return success(res, exerciseTemplates);
    } catch (err) {
        console.error('Error fetching exercise templates:', err);
        return error(res, 'Failed to fetch exercise templates');
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const exerciseTemplate = await exerciseTemplateService.getExerciseTemplateById(id);

        if (!exerciseTemplate) {
            return error(res, 'No exercise template found', 404);
        }

        return success(res, exerciseTemplate);
    } catch (err) {
        console.error('Error fetching exercise template:', err);
        return error(res, 'Failed to fetch exercise template');
    }
});

router.post('/', validate(createExerciseTemplateSchema), async (req, res) => {
    const { sessionTemplateId, exerciseId, orderIndex, baseSets, baseReps, baseWeight } = req.body;
    try {
        const newExerciseTemplate = await exerciseTemplateService.addExerciseTemplate(sessionTemplateId, exerciseId, orderIndex, baseSets, baseReps, baseWeight);
        return success(res, newExerciseTemplate, 201);
    } catch (err) {
        console.error('Error creating exercise template:', err);
        return error(res, 'Failed to create exercise template');
    }
});

router.put('/:id', validate(updateExerciseTemplateSchema), async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    try {
        if (updateData.sessionTemplateId) {
            const sessionTemplate = await sessionTemplateService.getTemplateById(updateData.sessionTemplateId);
            if (!sessionTemplate) {
                return error(res, 'Session template not found', 404);
            }
        }

        if (updateData.exerciseId) {
            const exercise = await exerciseService.getExerciseById(updateData.exerciseId);
            if (!exercise) {
                return error(res, 'Exercise not found', 404);
            }
        }

        const affectedRows = await exerciseTemplateService.updateExerciseTemplate(id, updateData);

        if (affectedRows === 0) {
            return error(res, 'No exercise template found', 404);
        }

        return success(res, 'Exercise template updated successfully');
    } catch (err) {
        console.error('Error updating exercise template:', err);
        return error(res, 'Failed to update exercise template');
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedRows = await exerciseTemplateService.deleteExerciseTemplate(id);

        if (deletedRows === 0) {
            return error(res, 'No exercise template found', 404);
        }

        return success(res, 'Exercise template deleted successfully');
    } catch (err) {
        console.error('Error deleting exercise template:', err);
        return error(res, 'Failed to delete exercise template');
    }
});

module.exports = router;
