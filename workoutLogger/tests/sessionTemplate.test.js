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

describe('Session template tests', () => {
    test('Creating a session template with valid input should result in a 200 and a meassage', async () => {

        const name = 'Test Plan';
        const description = 'This is a test workout plan';
        const durationWeeks = 4;

        const planResponse = await request(app)
            .post('/api/v1/workout-plan')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name, description, durationWeeks })

        console.log(planResponse.body);
        
        expect(planResponse.body.status).toBe('success');
        expect(planResponse.body.statuscode).toBe(200);
        expect(planResponse.body.data.result).toBe('Workout plan created successfully');

        const sessionData = {
            name: "Chest Day",
            dayOffset: 0,
            workoutPlanId: 2
        }

        const response = await request(app)
            .post('/api/v1/session-template')
            .set('Authorization', `Bearer ${authToken}`)
            .send(sessionData);
        
          
        console.log(response.body);

        expect(response.statusCode).toBe(200)
        
    })

});

afterAll(async () => {
    await db.sequelize.close();
});
