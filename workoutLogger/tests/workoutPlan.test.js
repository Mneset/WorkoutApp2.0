process.env.NODE_ENV = 'test';
process.env.AUTH_AUDIENCE = 'http://localhost:3000/api/v1';
process.env.AUTH_ISSUER_BASE_URL = 'https://dev-n8xnfzfw0w26p6nq.us.auth0.com';

const request = require('supertest');
const path = require('path');
const app = require('../testingApp');
const db = require('../models');
const { seedTestDb } = require('../utils/seedTestDb');
const { auth } = require('express-oauth2-jwt-bearer');
const { log } = require('console');

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
        console.log('Auth0 Token Response:', data); // More detailed logging
        console.log('Access Token:', data.access_token);
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

        console.log(response.body);
        

        expect(response.body.status).toBe('success');
        expect(response.body.statusCode).toBe(200);
        expect(response.body.data.result).toBe('Workout plan created successfully');
        
    })
});

afterAll(async () => {
    await db.sequelize.close();
});
