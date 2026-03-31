const express = require('express');
const router = express.Router();
const db = require('../models');
const SetsService = require('../services/setsService');
const setsService = new SetsService(db);
const checkForUser = require('../utils/userCreator');
const { success, error } = require('../utils/response');

router.use(checkForUser);

router.get('/', async (req, res) => {
    try {
        const setTypes = await setsService.getAllSetTypes();
        return success(res, setTypes);
    } catch (err) {
        console.error(err);
        return error(res, 'Failed to get set types');
    }
});

module.exports = router;
