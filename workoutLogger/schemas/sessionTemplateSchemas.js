const { z } = require('zod');

const createSessionTemplateSchema = z.object({
    name: z.string().min(1, 'name is required'),
    dayOffset: z.number().int().nonnegative('dayOffset must be a non-negative integer'),
    workoutPlanId: z.number().int().positive('workoutPlanId is required')
});

const updateSessionTemplateSchema = z.object({
    name: z.string().min(1).optional(),
    dayOffset: z.number().int().nonnegative().optional(),
    workoutPlanId: z.number().int().positive().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
});

module.exports = { createSessionTemplateSchema, updateSessionTemplateSchema };
