const { z } = require('zod');

const createWorkoutPlanSchema = z.object({
    name: z.string().min(1, 'name is required'),
    description: z.string().min(1, 'description is required'),
    durationWeeks: z.number().int().positive('durationWeeks must be a positive integer')
});

const updateWorkoutPlanSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    durationWeeks: z.number().int().positive().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
});

module.exports = { createWorkoutPlanSchema, updateWorkoutPlanSchema };
