const { z } = require('zod');

// One prescribed set within an exercise template: strength uses reps/weight/rir,
// cardio uses durationSeconds/distance; rpe applies to both. All optional/nullable.
const setTemplateSchema = z.object({
    // Reps may be a single number or a range string like "8-12".
    reps: z.union([z.string(), z.number()]).nullable().optional(),
    weight: z.coerce.number().nonnegative().nullable().optional(),
    durationSeconds: z.coerce.number().int().nonnegative().nullable().optional(),
    distance: z.coerce.number().nonnegative().nullable().optional(),
    rpe: z.coerce.number().min(0).max(10).nullable().optional(),
    rir: z.coerce.number().int().nonnegative().nullable().optional(),
    notes: z.string().nullable().optional()
});

// baseReps (strength) and baseDurationSeconds/baseDistance (cardio) are all optional —
// the client sends the pair matching the exercise's type. baseSets applies to both.
// `sets` carries the full per-set prescription; the base_* fields remain as a fallback.
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
    baseRir: z.coerce.number().int().nonnegative().nullable().optional(),
    sets: z.array(setTemplateSchema).nullable().optional(),
    notes: z.string().nullable().optional()
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
    baseRir: z.coerce.number().int().nonnegative().nullable().optional(),
    sets: z.array(setTemplateSchema).nullable().optional(),
    notes: z.string().nullable().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
});

module.exports = { createExerciseTemplateSchema, updateExerciseTemplateSchema };
