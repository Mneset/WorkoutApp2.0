const express = require('express');
const router = express.Router();
const db = require('../models');
const SetsService = require('../services/setsService');
const setsService = new SetsService(db);
const checkForUser = require('../utils/userCreator');

router.use(checkForUser);

router.get('/', async (req, res) => {
    try {
        const setTypes = await setsService.getAllSetTypes()
        res.status(200).json({ setTypes })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get setTypes'})
    }
})

module.exports = router;