const { z } = require('zod');

const createExerciseTemplateSchema = z.object({
    sessionTemplateId: z.number().int().positive('sessionTemplateId is required'),
    exerciseId: z.number().int().positive('exerciseId is required'),
    orderIndex: z.number().int().nonnegative('orderIndex must be a non-negative integer'),
    baseSets: z.number().int().positive('baseSets must be a positive integer'),
    baseReps: z.number().int().positive('baseReps must be a positive integer'),
    baseWeight: z.number().nonnegative().optional().nullable()
});

const updateExerciseTemplateSchema = z.object({
    sessionTemplateId: z.number().int().positive().optional(),
    exerciseId: z.number().int().positive().optional(),
    orderIndex: z.number().int().nonnegative().optional(),
    baseSets: z.number().int().positive().optional(),
    baseReps: z.number().int().positive().optional(),
    baseWeight: z.number().nonnegative().optional().nullable()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
});

module.exports = { createExerciseTemplateSchema, updateExerciseTemplateSchema };
