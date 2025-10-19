const createError = require('http-errors')
const express = require('express');
const cors = require('cors');
const app = express();
const { auth } = require('express-oauth2-jwt-bearer')
const { errorHandler } = require('./utils/errorHandler');

const jwtCheck = auth ({
    audience: process.env.AUTH_AUDIENCE,
    issuerBaseURL: process.env.AUTH_ISSUER_BASE_URL,
    tokenSigningAlg: 'RS256'
});

// Defining the routes
const indexRouter = require('./routes/index')
const sessionRouter = require('./routes/sessionLog');
const setsRouter = require('./routes/sets');
const exercisesRouter = require('./routes/exerciseLog');
const workoutPlanRouter = require('./routes/workoutPlan');
const sessionTemplateRouter = require('./routes/sessionTemplate');
const exerciseTemplateRouter = require('./routes/exerciseTemplate');
const usersRouter = require('./routes/user')

const apiPreFix = '/api/v1';

// Middleware
app.use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Using the routes WITH JWT middleware
app.use(jwtCheck);
app.use(apiPreFix, indexRouter);
app.use(`${apiPreFix}/session`, sessionRouter);
app.use(`${apiPreFix}/sets`, setsRouter);
app.use(`${apiPreFix}/exercise-log`, exercisesRouter);
app.use(`${apiPreFix}/workout-plan`, workoutPlanRouter);
app.use(`${apiPreFix}/session-template`, sessionTemplateRouter);
app.use(`${apiPreFix}/exercise-template`, exerciseTemplateRouter);
app.use(`${apiPreFix}/users`, usersRouter)

// Error handling
app.use(function(req, res, next) {
  next(createError(404));
});

app.use(errorHandler);

module.exports = app;