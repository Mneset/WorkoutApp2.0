const { Sequelize, DataTypes } = require('sequelize')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const env = process.env.NODE_ENV || 'development';

let databaseName = process.env.DB_NAME;
if (env === 'test') {
    databaseName = 'workout_logger_test';
}

// Database connection

const sequelize = new Sequelize({
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database: databaseName,
    dialect: process.env.DB_DIALECT,
    define: {
        underscored: process.env.DB_UNDERSCORED === 'true',
        timestamps: process.env.DB_TIMESTAMPS === 'true'
    }
});

//Database wrapper

const db = {};
db.sequelize = sequelize;

//Initializing the models with the sequelize instance, and adding them to the db object with the model name as the key

fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.model.js'))
    .forEach(file => {
        const model = require(path.join(__dirname, file))(sequelize, DataTypes);
        db[model.name] = model;
    });

// Setting up associations by calling the associate method on each model and passing the db object, only if it exists

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

// Exporting the db object

module.exports = db;