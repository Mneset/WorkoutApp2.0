const express = require('express');
const router = express.Router();
const db = require('../models');
const SessionService = require('../services/sessionService');
const sessionService = new SessionService(db);
const checkForUser = require('../utils/userCreator');

router.use(checkForUser);

router.delete('/:id', async (req, res) => {
    const sessionLogId  = req.params.id;

    console.log(`Deleting session with ID: ${sessionLogId}`);
    
    try {
        if (!sessionLogId) {
            return res.status(400).json({ message: 'Session ID is required' });
        }
        const session = await sessionService.deleteSession(sessionLogId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        res.status(200).json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete session' });
    }
});

router.post('/', async (req, res) => {
    const { userId } = req.body;
    console.log('req.auth:', req.auth.payload.sub);
    console.log(req.body);
    
    if(req.auth.payload.sub !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    try {
        const session = await sessionService.startSession(userId);
        res.status(201).json({ sessionLogId: session.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to start session' });
    }
});

router.put('/:id', async (req, res) => {
    const sessionLogId = req.params.id;
    const { notes, updatedLogs, name } = req.body;
    try {
        const session = await sessionService.endSession(notes, sessionLogId, updatedLogs, name);
        res.status(200).json({ session });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to end session' });
    }
});

router.get('/', async (req, res) => {
    const { userId } = req.query;
    try {
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        const sessions = await sessionService.getSessionsByUserId(userId);
        res.status(200).json({ sessions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get sessions' });
    }
})

router.get('/:id', async (req, res) => {
    const sessionLogId = req.params.id;
    try {
        if(!sessionLogId) {
            return res.status(400).json({ message: 'Session ID is required' });
        }
        const session = await sessionService.getSessionById(sessionLogId);
        res.status(200).json({ session});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get session'})
    }
})

module.exports = router;