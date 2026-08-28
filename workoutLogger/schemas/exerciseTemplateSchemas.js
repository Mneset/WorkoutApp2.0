const { z } = require('zod');

// baseReps (strength) and baseDurationSeconds/baseDistance (cardio) are all optional —
// the client sends the pair matching the exercise's type. baseSets applies to both.
const createExerciseTemplateSchema = z.object({
    sessionTemplateId: z.number().int().positive('sessionTemplateId is required'),
    exerciseId: z.number().int().positive('exerciseId is required'),
    orderIndex: z.number().int().nonnegative('orderIndex must be a non-negative integer'),
    baseSets: z.number().int().positive('baseSets must be a positive integer'),
    baseReps: z.coerce.number().int().positive().nullable().optional(),
    baseWeight: z.coerce.number().nonnegative().optional().nullable(),
    baseDurationSeconds: z.coerce.number().int().nonnegative().nullable().optional(),
    baseDistance: z.coerce.number().nonnegative().nullable().optional(),
    baseRpe: z.coerce.number().min(0).max(10).nullable().optional(),
    baseRir: z.coerce.number().int().nonnegative().nullable().optional()
});

const updateExerciseTemplateSchema = z.object({
    sessionTemplateId: z.number().int().positive().optional(),
    exerciseId: z.number().int().positive().optional(),
    orderIndex: z.number().int().nonnegative().optional(),
    baseSets: z.number().int().positive().optional(),
    baseReps: z.coerce.number().int().positive().nullable().optional(),
    baseWeight: z.coerce.number().nonnegative().optional().nullable(),
    baseDurationSeconds: z.coerce.number().int().nonnegative().nullable().optional(),
    baseDistance: z.coerce.number().nonnegative().nullable().optional(),
    baseRpe: z.coerce.number().min(0).max(10).nullable().optional(),
    baseRir: z.coerce.number().int().nonnegative().nullable().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
});

module.exports = { createExerciseTemplateSchema, updateExerciseTemplateSchema };
