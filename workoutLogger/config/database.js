const db = require('../models');

async function initializeDb() {
    try {
        await db.sequelize.authenticate();
        console.log('Database connected');
    } catch (error) {
        console.error('Failed to connect to database:', error);
        throw error;
    }
}

module.exports = { initializeDb };
