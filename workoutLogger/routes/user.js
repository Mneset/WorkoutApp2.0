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

router.get('/', async (req, res, next) => {
    const userId = req.auth?.payload.sub

    try {
        const user = await userService.getCurrentPlanStatus(userId)

        if(!user) {
            return next(createError(404, 'User not found'))
        }

        console.log(user)

        res.status(200).json({
                    status: 'success',
                    statuscode: 200,
                    data: {
                        result: user
                    }
                })
    } catch(error) {
        conosle.error(error)
    }
})

router.put('/:id', async (req, res, next) => {
    // Change to use the current users id, not one given in the params
    const userId = req.params.id
    const { workoutPlanId, startDate } = req.body
    try {
       const user = await userService.findUserById(userId)

       if(!user) {
        return next(createError(494, 'No user found with that id')) 
       }
       
       let activePlan = await userService.getCurrentPlanStatus(userId)
       
       // Temporary. Should implement comfirm replacing a plan if user has a active plan
       if(activePlan) {
          return next(createError(400, 'User already has an active plan. Quit current plan to start a bew one'))
       }
       
       const workoutPlan = await workoutPlanService.getWorkoutPlanById(workoutPlanId)

       if(!workoutPlan) {
        return next(createError(404, 'No workoutplan found with that id'))
       }

       const startDateCheck = new Date(startDate)
       if(isNaN(startDateCheck.getTime())) {
        return next(createError(400, 'Start date has to be a valid date')) 
       }
       
       await workoutPlanService.startWorkoutPlan(userId, workoutPlanId, startDate) 

       activePlan = await userService.getCurrentPlanStatus(userId)

       res.status(200).json({
        status: 'success',
        statuscode: 200,
        data: {
            result: activePlan
        }
       })
    } catch(error) {
        console.error('Error fetching workout plans:', error);
        next(createError(error))
    }
})

module.exports = router