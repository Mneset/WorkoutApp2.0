const { z } = require('zod');

const startPlanSchema = z.object({
    workoutPlanId: z.number().int().positive('workoutPlanId is required'),
    startDate: z.string().refine(val => !isNaN(new Date(val).getTime()), {
        message: 'startDate must be a valid date string'
    })
});

module.exports = { startPlanSchema };
