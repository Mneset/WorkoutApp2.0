const { z } = require('zod');

const startSessionSchema = z.object({
    userId: z.string().min(1, 'userId is required'),
    sessionTemplateId: z.number().int().positive().optional()
});

const endSessionSchema = z.object({
    notes: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    updatedLogs: z.array(z.object({
        id: z.number().int().positive(),
        reps: z.coerce.number().int().nonnegative().optional(),
        weight: z.coerce.number().nonnegative().optional(),
        notes: z.string().optional().nullable(),
        rpe: z.coerce.number().min(0).max(10).nullable().optional(),
        rir: z.coerce.number().int().nonnegative().nullable().optional()
    })).optional()
});

const getSessionsQuerySchema = z.object({
    userId: z.string().min(1, 'userId is required')
});

module.exports = { startSessionSchema, endSessionSchema, getSessionsQuerySchema };
