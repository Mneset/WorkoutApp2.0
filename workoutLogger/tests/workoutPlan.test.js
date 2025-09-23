process.env.NODE_ENV = 'test';
process.env.AUTH_AUDIENCE = 'http://localhost:3000/api/v1';
process.env.AUTH_ISSUER_BASE_URL = 'https://dev-n8xnfzfw0w26p6nq.us.auth0.com';

const request = require('supertest');
const path = require('path');
const app = require('../testingApp');
const db = require('../models');
const { seedTestDb } = require('../utils/seedTestDb');

async function getToken() {
    try {
        const response = await fetch('https://dev-n8xnfzfw0w26p6nq.us.auth0.com/oauth/token', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
            "client_id":"Gp8hnNgSEgOOYjmuKnt8kYtv0H8IFyih",
            "client_secret":"RqJm-T84wJzbazCew8svFpnBcvzUXcAt-ZTSFaGmTH_uV8T12F8remcb6HO20Ipg",
            "audience": "http://localhost:3000/api/v1",
            "grant_type":"client_credentials"
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Auth0 request failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.access_token;
  } catch (error) {
      console.error('Error fetching token:', error);
      throw error;
  }
};

let authToken;

beforeAll(async () => {
    authToken = await getToken();

    await db.sequelize.sync({ force: true });
    await seedTestDb(db);
});

describe('Workout Plan tests', () => {
    test('Creating a new workout plan with valid credentials should result in a 200', async () => {
        const name = 'Test Plan';
        const description = 'This is a test workout plan';
        const durationWeeks = 4;

        const response = await request(app)
            .post('/api/v1/workout-plan')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name, description, durationWeeks })

        //console.log(response.body);
        
        expect(response.body.status).toBe('success');
        expect(response.body.statuscode).toBe(200);
        expect(response.body.data.result).toBe('Workout plan created successfully');
        
    })

    test('Creating a new workout plan with missing fields should result in a 400', async () => {
        const name = 'Test Plan';
        const description = 'This is a test workout plan';

        const response = await request(app)
            .post('/api/v1/workout-plan')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name, description })

        //console.log(response.body);

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.statuscode).toBe(400);
        expect(response.body.data.result).toBe('Missing required fields: name, description, or durationWeeks');
    })

    test('Fetching all workout plans should result in a 200 and return plans', async () => {
        const response = await request(app)
            .get('/api/v1/workout-plan')
            .set('Authorization', `Bearer ${authToken}`)

        //console.log(response.body);
        //console.log(response.body.data.plans);

        expect(response.status).toBe(200);    
        expect(response.body.status).toBe('success');
        expect(response.body.statuscode).toBe(200);
        expect(Array.isArray(response.body.data.result)).toBe(true);
        expect(response.body.data.result.length).toBe(2);
    })

    test('Fetching all workout plans when none exist should result in a 404', async () => {
        // First, clear the WorkoutPlan table
        await db.WorkoutPlan.destroy({ where: {} });

        const response = await request(app)
            .get('/api/v1/workout-plan')
            .set('Authorization', `Bearer ${authToken}`)

        //console.log(response.body);
        //console.log(response.body.data.plans);

        expect(response.status).toBe(404);    
        expect(response.body.status).toBe('error');
        expect(response.body.statuscode).toBe(404);
        expect(response.body.data.result).toBe('No workout plans found');
    })

    test('Fetching a workout plan by ID that does not exist should result in a 404 and a message', async () => {
        const response = await request(app)
            .get('/api/v1/workout-plan/9999')
            .set('Authorization', `Bearer ${authToken}`)

        //console.log(response.body);

        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
        expect(response.body.statuscode).toBe(404);
        expect(response.body.data.result).toBe('No workout plan found');
    })

    test('Fetching a workout plan by ID that exists should result in a 200 and return the plan', async () => {

        const name = 'Test Plan';
        const description = 'This is a test workout plan';
        const durationWeeks = 4;

        const response = await request(app)
            .post('/api/v1/workout-plan')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name, description, durationWeeks })

        //console.log(response.body);
        
        expect(response.body.status).toBe('success');
        expect(response.body.statuscode).toBe(200);
        expect(response.body.data.result).toBe('Workout plan created successfully');

        const getResponse = await request(app)
            .get('/api/v1/workout-plan/3')
            .set('Authorization', `Bearer ${authToken}`)

        //console.log(getResponse.body);

        expect(getResponse.status).toBe(200);
        expect(getResponse.body.status).toBe('success');
        expect(getResponse.body.statuscode).toBe(200);
        expect(getResponse.body.data.result).toHaveProperty('id', 3);
        expect(getResponse.body.data.result).toHaveProperty('name', name);
        expect(getResponse.body.data.result).toHaveProperty('description', description);
        expect(getResponse.body.data.result).toHaveProperty('durationWeeks', durationWeeks);
    })

    test('updatimg a workout plan that exists with valid info should result in a 200 and return the updated plan', async () => {
        
        const updateData = {
            name: 'Updated Test Plan',
        }

        const response = await request(app)
            .put('/api/v1/workout-plan/3')
            .set('Authorization', `Bearer ${authToken}`)
            .send(updateData)

        //console.log(response.body);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.statuscode).toBe(200);
        expect(response.body.data.result).toBe('Workout plan updated successfully');
    })

    test('updating a workout plan that does not exist should result in a 404 and a message', async () => {
        
        const updateData = {
            name: 'Updated Test Plan',
        }

        const response = await request(app)
            .put('/api/v1/workout-plan/9999')
            .set('Authorization', `Bearer ${authToken}`)
            .send(updateData)

        //console.log(response.body);

        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
        expect(response.body.statuscode).toBe(404);
        expect(response.body.data.result).toBe('No workout plan found');
    })

    test('Updating a workout plan with no data should result in a 400 and a message', async () => {
        
        const updateData = { }

        const response = await request(app)
            .put('/api/v1/workout-plan/3')
            .set('Authorization', `Bearer ${authToken}`)
            .send(updateData)

        //console.log(response.body);

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.statuscode).toBe(400);
        expect(response.body.data.result).toBe('No data provided for update');
    })

    test('Deleting a workout plan that exists should result in a 200 and a message', async () => {
        
        const response = await request(app)
            .delete('/api/v1/workout-plan/3')
            .set('Authorization', `Bearer ${authToken}`)

        //console.log(response.body);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.statuscode).toBe(200);
        expect(response.body.data.result).toBe('Workout plan deleted successfully');
    })

    test('Deleting a workout plan that does not exist should result in a 404 and a message', async () => {
        
        const response = await request(app)
            .delete('/api/v1/workout-plan/9999')
            .set('Authorization', `Bearer ${authToken}`)
        
        //console.log(response.body);

        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
        expect(response.body.statuscode).toBe(404);
        expect(response.body.data.result).toBe('No workout plan found');
    })

});

afterAll(async () => {
    await db.sequelize.close();
});
