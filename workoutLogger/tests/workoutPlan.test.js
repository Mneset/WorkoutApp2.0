const request = require('supertest');
const path = require('path');
const app = require('../testingApp');
const db = require('../models');
const { seedTestDb } = require('../utils/seedTestDb');

beforeAll(async () => {
    console.log('Current working directory:', process.cwd());
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Database config:', db.sequelize.config);

    await db.sequelize.sync({ force: true });
    await seedTestDb(db);

    console.log('Database file should be at:', path.resolve('./test.db'));
});

describe('Workout Plan tests', () => {
    test('Creating a new workout plan with valid credentials should result in a 200', async () => {
        const name = 'Test Plan';
        const description = 'This is a test workout plan';
        const durationWeeks = 4;

        const response = await request(app)
            .post('/api/v1/workout-plan')
            .send({ name, description, durationWeeks })

        expect(response.body.status).toBe('success');
        expect(response.body.statusCode).toBe(200);
        expect(response.body.data.result).toBe('Workout plan created successfully');
        
    })
});

afterAll(async () => {
    await db.sequelize.close();
});
