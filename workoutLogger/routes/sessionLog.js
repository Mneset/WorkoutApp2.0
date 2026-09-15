const express = require('express');
const router = express.Router();
const db = require('../models');
const SessionService = require('../services/sessionService');
const sessionService = new SessionService(db);
const checkForUser = require('../utils/userCreator');
const { validate, validateQuery } = require('../middleware/validate');
const { startSessionSchema, endSessionSchema, getSessionsQuerySchema } = require('../schemas/sessionSchemas');
const { success, error } = require('../utils/response');

if (process.env.NODE_ENV !== 'test') {
    router.use(checkForUser);
}

router.post('/', validate(startSessionSchema), async (req, res) => {
    const { userId, sessionTemplateId } = req.body;

    if (process.env.NODE_ENV !== 'test' && req.auth?.payload?.sub !== userId) {
        return error(res, 'Unauthorized', 403);
    }
    try {
        const session = await sessionService.startSession(userId, sessionTemplateId);
        return success(res, { sessionLogId: session.id }, 201);
    } catch (err) {
        console.error(err);
        return error(res, 'Failed to start session');
    }
});

router.put('/:id', validate(endSessionSchema), async (req, res) => {
    const sessionLogId = req.params.id;
    const { notes, updatedLogs, name } = req.body;
    try {
        const session = await sessionService.endSession(notes, sessionLogId, updatedLogs, name);
        return success(res, session);
    } catch (err) {
        console.error(err);
        return error(res, 'Failed to end session');
    }
});

// Save the session note/name mid-session without ending it (fires on blur so the note
// survives leaving and resuming the workout).
router.patch('/:id', async (req, res) => {
    const { notes, name } = req.body;
    try {
        await sessionService.updateSessionInfo(req.params.id, { notes, name });
        return success(res, 'Session updated');
    } catch (err) {
        console.error('Failed to update session info:', err);
        return error(res, 'Failed to update session');
    }
});

router.get('/', validateQuery(getSessionsQuerySchema), async (req, res) => {
    const { userId } = req.query;
    try {
        const sessions = await sessionService.getSessionsByUserId(userId);
        return success(res, sessions);
    } catch (err) {
        console.error(err);
        return error(res, 'Failed to get sessions');
    }
});

router.get('/:id', async (req, res) => {
    const sessionLogId = req.params.id;
    try {
        const session = await sessionService.getSessionById(sessionLogId);
        if (!session) {
            return error(res, 'Session not found', 404);
        }
        return success(res, session);
    } catch (err) {
        console.error(err);
        return error(res, 'Failed to get session');
    }
});

router.delete('/:id', async (req, res) => {
    const sessionLogId = req.params.id;
    try {
        const deleted = await sessionService.deleteSession(sessionLogId);
        if (!deleted) {
            return error(res, 'Session not found', 404);
        }
        return success(res, 'Session deleted successfully');
    } catch (err) {
        console.error(err);
        return error(res, 'Failed to delete session');
    }
});

module.exports = router;
