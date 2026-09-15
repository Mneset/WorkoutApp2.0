const { z } = require('zod');

const startPlanSchema = z.object({
    workoutPlanId: z.number().int().positive('workoutPlanId is required'),
    startDate: z.string().refine(val => !isNaN(new Date(val).getTime()), {
        message: 'startDate must be a valid date string'
    })
});

const updateProfileSchema = z.object({
    username: z.string().min(1).max(100).optional(),
    preferences: z.object({
        // Creating (plan/template builder) context
        metricsEnabled: z.boolean().optional(),
        showWeight: z.boolean().optional(),
        showTime: z.boolean().optional(),
        showPct: z.boolean().optional(),
        showRpe: z.boolean().optional(),
        showRir: z.boolean().optional(),
        showNotes: z.boolean().optional(),
        showLastTime: z.boolean().optional(),
        // Logging (live session) context
        logRpe: z.boolean().optional(),
        logRir: z.boolean().optional(),
        logNotes: z.boolean().optional(),
        logLast: z.boolean().optional(),
        logTime: z.boolean().optional(),
        basicExercisesOnly: z.boolean().optional(),
    }).partial().optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
});

module.exports = { startPlanSchema, updateProfileSchema };
