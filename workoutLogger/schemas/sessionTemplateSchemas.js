const { z } = require('zod');

const createSessionTemplateSchema = z.object({
    name: z.string().min(1, 'name is required'),
    // Optional for standalone templates (dayOffset defaults to 0 server-side).
    dayOffset: z.number().int().nonnegative().optional(),
    // A template belongs to a plan (workoutPlanId) or a user (userId, standalone).
    workoutPlanId: z.number().int().positive().nullable().optional(),
    userId: z.string().min(1).nullable().optional(),
    notes: z.string().nullable().optional()
});

const updateSessionTemplateSchema = z.object({
    name: z.string().min(1).optional(),
    dayOffset: z.number().int().nonnegative().optional(),
    workoutPlanId: z.number().int().positive().optional(),
    notes: z.string().nullable().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
});

module.exports = { createSessionTemplateSchema, updateSessionTemplateSchema };
