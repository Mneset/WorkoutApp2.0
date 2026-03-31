const express = require('express');
const router = express.Router();
const { success, error } = require('../utils/response');

router.get('/', function (req, res) {
    try {
        return success(res, 'Connected!');
    } catch (err) {
        return error(res, 'Failed to connect to database');
    }
});

module.exports = router;
