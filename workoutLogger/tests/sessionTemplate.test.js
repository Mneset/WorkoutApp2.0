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

        //console.log(planResponse.body);
        
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
        
          
        //console.log(response.body);

        expect(response.statusCode).toBe(200)
        
    })

    test('Creating a session template with missing fields should result in a 400', async () => {
        const sessionData = {
            name: "Leg Day",
            workoutPlanId: 2
        }

        const respone = await request(app)
            .post('/api/v1/session-template')
            .set('Authorization', `Bearer ${authToken}`)
            .send(sessionData);

        //console.log(respone.body);

        expect(respone.statusCode).toBe(400)
    })


    test('Creating a session template with invalid workoutPlanId should result in a 404', async () => {
        const sessionData = {
            name: "Leg Day",
            dayOffset: 3,
            workoutPlanId: 999
        }

        const response = await request(app)
            .post('/api/v1/session-template')
            .set('Authorization', `Bearer ${authToken}`)
            .send(sessionData);

        //console.log(response.body);

        expect(response.statusCode).toBe(404)
    })

    test('Deleting a session template that exists should result in a 200 and a message', async () => {

        const createData = {
            name: "Back Day",
            dayOffset: 1,
            workoutPlanId: 2
        }

        const createResponse = await request(app)
            .post('/api/v1/session-template')
            .set('Authorization', `Bearer ${authToken}`)
            .send(createData);

        console.log(createResponse.body);
        
        expect(createResponse.statusCode).toBe(200);

        //console.log(createResponse.body.data.session.id);
        
        const deleteResponse = await request(app)
            .delete(`/api/v1/session-template/${createResponse.body.data.session.id}`)
            .set('Authorization', `Bearer ${authToken}`);
        
        //console.log(deleteResponse.body);
    
        expect(deleteResponse.statusCode).toBe(200);
    });

    test('Deleting a session template that does not exist should result in a 404', async () => {

        const deleteResponse = await request(app)
            .delete('/api/v1/session-template/999')
            .set('Authorization', `Bearer ${authToken}`);

        //console.log(deleteResponse.body);

        expect(deleteResponse.statusCode).toBe(404);
    });

    test('Updating a session template that exists with valid data should result in a 200 and a message', async () => {
        const updateData = {
            name: "Updated Chest Day",
        }

        const updateResponse = await request(app)
            .put('/api/v1/session-template/1')
            .set('Authorization', `Bearer ${authToken}`)
            .send(updateData);

        console.log(updateResponse.body);

        expect(updateResponse.statusCode).toBe(200);
    })

    test('Updating a session template that does not exist should result in a 404', async () => {
        const updateData = {
            name: "Updated session",
        }

        const updateResponse = await request(app)
            .put('/api/v1/session-template/999')
            .set('Authorization', `Bearer ${authToken}`)
            .send(updateData);

        console.log(updateResponse.body);

        expect(updateResponse.statusCode).toBe(404);
    })

    test('Updating a session template with no data should result in a 400', async () => {
        const updateResponse = await request(app)
            .put('/api/v1/session-template/1')
            .set('Authorization', `Bearer ${authToken}`)
            .send({});

        console.log(updateResponse.body);

        expect(updateResponse.statusCode).toBe(400);
    })

    test('Updating a session template with invalid workoutPlanId should result in a 404', async () => {
        const updateData = {
            workoutPlanId: 999
        }

        const updateResponse = await request(app)
            .put('/api/v1/session-template/1')
            .set('Authorization', `Bearer ${authToken}`)
            .send(updateData);

        console.log(updateResponse.body);

        expect(updateResponse.statusCode).toBe(404);
    })
})

afterAll(async () => {
    await db.sequelize.close();
});
