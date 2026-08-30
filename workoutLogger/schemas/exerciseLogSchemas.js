const { z } = require('zod');

// reps/weight (strength) and durationSeconds/distance (cardio) are all optional — the
// client sends the pair that matches the exercise's type.
const createExerciseLogSchema = z.object({
    exerciseId: z.number().int().positive('exerciseId is required'),
    setId: z.number().int().positive('setId is required'),
    reps: z.coerce.number().int().nonnegative('reps must be a non-negative integer').nullable().optional(),
    weight: z.coerce.number().nonnegative('weight must be non-negative').nullable().optional(),
    durationSeconds: z.coerce.number().int().nonnegative().nullable().optional(),
    distance: z.coerce.number().nonnegative().nullable().optional(),
    orderIndex: z.coerce.number().int().nonnegative().nullable().optional(),
    notes: z.string().optional().nullable(),
    rpe: z.coerce.number().min(0).max(10).nullable().optional(),
    rir: z.coerce.number().int().nonnegative().nullable().optional(),
    // Prescription placeholders carried from a plan/template (target_reps may be a range).
    targetReps: z.union([z.string(), z.number()]).nullable().optional(),
    targetWeight: z.union([z.string(), z.number()]).nullable().optional(),
    targetWeightPct: z.coerce.number().nonnegative().nullable().optional(),
    targetDurationSeconds: z.coerce.number().int().nonnegative().nullable().optional(),
    targetDistance: z.coerce.number().nonnegative().nullable().optional(),
    sessionLogId: z.number().int().positive('sessionLogId is required')
});

const updateExerciseLogSchema = z.object({
    reps: z.coerce.number().int().nonnegative().nullable().optional(),
    weight: z.coerce.number().nonnegative().nullable().optional(),
    durationSeconds: z.coerce.number().int().nonnegative().nullable().optional(),
    distance: z.coerce.number().nonnegative().nullable().optional(),
    orderIndex: z.coerce.number().int().nonnegative().nullable().optional(),
    notes: z.string().optional().nullable(),
    rpe: z.coerce.number().min(0).max(10).nullable().optional(),
    rir: z.coerce.number().int().nonnegative().nullable().optional(),
    // Allow resolving a %-of-1RM target once a 1RM is set mid-session.
    targetWeight: z.union([z.string(), z.number()]).nullable().optional(),
    targetWeightPct: z.coerce.number().nonnegative().nullable().optional()
});

module.exports = { createExerciseLogSchema, updateExerciseLogSchema };
