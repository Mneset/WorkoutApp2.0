const { z } = require('zod');

const upsertOneRepMaxSchema = z.object({
    userId: z.string().min(1, 'userId is required'),
    exerciseId: z.coerce.number().int().positive('exerciseId is required'),
    oneRm: z.coerce.number().positive('oneRm must be a positive number'),
});

module.exports = { upsertOneRepMaxSchema };
