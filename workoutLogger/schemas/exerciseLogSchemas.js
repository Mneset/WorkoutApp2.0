const { z } = require('zod');

const createExerciseLogSchema = z.object({
    exerciseId: z.number().int().positive('exerciseId is required'),
    setId: z.number().int().positive('setId is required'),
    reps: z.coerce.number().int().nonnegative('reps must be a non-negative integer'),
    weight: z.coerce.number().nonnegative('weight must be non-negative'),
    notes: z.string().optional().nullable(),
    sessionLogId: z.number().int().positive('sessionLogId is required')
});

const updateExerciseLogSchema = z.object({
    reps: z.coerce.number().int().nonnegative().optional(),
    weight: z.coerce.number().nonnegative().optional(),
    notes: z.string().optional().nullable()
});

module.exports = { createExerciseLogSchema, updateExerciseLogSchema };
