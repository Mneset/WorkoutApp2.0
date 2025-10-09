const express = require('express');
const router = express.Router();
const db = require('../models');
const createError = require('http-errors')
const ExerciseTemplateService = require('../services/exerciseTemplateService');
const exerciseTemplateService = new ExerciseTemplateService(db);
const ExerciseService = require('../services/exerciseService');
const exerciseService = new ExerciseService(db);
const SessionTemplateService = require('../services/sessionTemplateService');
const sessionTemplateService = new SessionTemplateService(db);
const checkForUser = require('../utils/userCreator');

if (process.env.NODE_ENV !== 'test') {
    router.use(checkForUser);
}

router.get('/', async (req, res, next) => {
    try {
        const exerciseTemplates = await exerciseTemplateService.getAllExerciseTemplates();

        if (!exerciseTemplates || exerciseTemplates.length === 0) {
            return next(createError(404, 'No exercise templates found'));
        }

        return res.status(200).json({
            status: 'success',
            statuscode: 200,
            data: {
                result: exerciseTemplates
            }
        })
    } catch (error) {
        console.error('Error fetching exercise templates:', error);
        next(createError(error))
    }
})

router.get('/:id', async (req, res, next) => {
    const { id } = req.params;
    try {
        const exerciseTemplate = await exerciseTemplateService.getExerciseTemplateById(id);

        if (!exerciseTemplate) {
            return next(createError(404, 'No exercise template found'));
        }

        return res.status(200).json({
            status: 'success',
            statuscode: 200,
            data: {
                result: exerciseTemplate
            }
        })
    } catch (error) {
        console.error('Error fetching exercise templates:', error);
        next(createError(error))
    }
})

router.post('/', async (req, res, next) => {
    const { sessionTemplateId, exerciseId, orderIndex, baseSets, baseReps, baseWeight } = req.body;
    try {
        if(!sessionTemplateId || !exerciseId || orderIndex === undefined || baseSets === undefined || baseReps === undefined) {
            return next(createError(400, 'Missing required fields: sessionTemplateId, exerciseId, orderIndex, baseSets, or baseReps'))
        }

        const newExerciseTemplate = await exerciseTemplateService.addExerciseTemplate(sessionTemplateId, exerciseId, orderIndex, baseSets, baseReps, baseWeight);
        
        return res.status(200).json({
            status: 'success',
            statuscode: 200,
            data: {
                result: newExerciseTemplate
            }
        })
    } catch (error) {
        console.error('Error creating exercise template:', error);
        next(createError(error))
    }
})

router.put('/:id', async (req, res, next) => {
    const { id } = req.params;
    const updateData = req.body;
    try {
        if(!updateData || Object.keys(updateData).length === 0) {
            return next(createError(400, 'No data provided for update'))
        }

        if(updateData.sessionTemplateId) {
            const sessionTemplate = await sessionTemplateService.getTemplateById(updateData.sessionTemplateId);
            if(!sessionTemplate) {
                return next(createError(404, 'Session template not found'))
            }
        }

        if(updateData.exerciseId) {
            const exercise = await exerciseService.getExerciseById(updateData.exerciseId);
            if(!exercise) {
                return next(createError(404, 'Exercise not found'))
            }
        }

        const affectedRows = await exerciseTemplateService.updateExerciseTemplate(id, updateData);

        if(affectedRows === 0) {
            return next(createError(404, 'No exercise template found'));
        }

        return res.status(200).json({
            status: 'success',
            statuscode: 200,
            data: {
                result: 'Exercise template updated successfully'
            }
        })
        
    } catch (error) {
        console.error('Error updating exercise template:', error);
        next(createError(error))
    }
})

router.delete('/:id', async (req, res, next) => {
    const { id } = req.params;
    try {
        const deletedRows = await exerciseTemplateService.deleteExerciseTemplate(id);

        if(deletedRows === 0) {
            return next(createError(404, 'No exercise template found'));
        }

        return res.status(200).json({
            status: 'success',
            statuscode: 200,
            data: {
                result: 'Exercise template deleted successfully'
            }
        })
    } catch (error) {
        console.error('Error deleting exercise template:', error);
        next(createError(error))
    }
})

module.exports = router;