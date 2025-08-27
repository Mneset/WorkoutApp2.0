const express = require('express');
const router = express.Router();
const db = require('../models');

router.get('/', function (req, res, next) {
    try {
        res.status(200).json({ message: 'Connected!' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to connect to database' });       
    }
});

module.exports = router;