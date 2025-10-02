const express = require('express');
const router = express.Router();
const db = require('../models');
const createError = require('http-errors')
const SessionTemplateService = require('../services/sessionTemplateService');
const sessionTemplateService = new SessionTemplateService(db);
const WorkoutPlanService = require('../services/workoutPlanService');
const workoutPlanService = new WorkoutPlanService(db);
const checkForUser = require('../utils/userCreator');

if (process.env.NODE_ENV !== 'test') {
    router.use(checkForUser);
}

router.get('/', async (req, res, next) => {
    try {
        
    } catch (error) {
        console.error('Error fetching workout plans:', error);
        next(createError(error))
    }
});

router.get('/:id', async (req, res, next) => {
    const { id } = req.params;
    try {
        
    } catch (error) {
        console.error('Error fetching workout plans:', error);
        next(createError(error))
    }
});

router.post('/', async (req, res, next) => {
    const { name, dayOffset, workoutPlanId } = req.body;
    try {
        if(!name || dayOffset === undefined || dayOffset === null || !workoutPlanId) {
            return next(createError(400, 'Missing required fields: name, dayOffset, or workoutPlanId'))
        }

        const workoutPlan = await workoutPlanService.getWorkoutPlanById(workoutPlanId);
        if(!workoutPlan) {
            return next(createError(404, 'Workout plan not found'))
        }

        const session = await sessionTemplateService.createTemplate(name, dayOffset, workoutPlanId);

        return res.status(200).json({
            status: 'success',
            statuscode: 200,
            data: {
                result: 'Session template created successfully',
                session: session
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
            return next(createError(400, 'No fields to update provided'))
        }

        if(updateData.workoutPlanId) {
            const workoutPlan = await workoutPlanService.getWorkoutPlanById(updateData.workoutPlanId);
            if(!workoutPlan) {
                return next(createError(404, 'Workout plan not found'))
            }
        }

        const affectedRows = await sessionTemplateService.updateTemplate(id, updateData);

        if(affectedRows === 0) {
            return next(createError(404, 'Session template not found'))
        }

        return res.status(200).json({
            status: 'success',
            statuscode: 200,
            data: {
                result: 'Session template updated successfully'
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
        const deletedRows = await sessionTemplateService.deleteTemplate(id);

        if(deletedRows === 0) {
            return next(createError(404, 'Session template not found'))
        }

        return res.status(200).json({
            status: 'success',
            statuscode: 200,
            data: {
                result: 'Session template deleted successfully'
            }
        })
    } catch (error) {
        console.error('Error updating workout plan:', error);
        next(createError(error))
    }
})


module.exports = router;