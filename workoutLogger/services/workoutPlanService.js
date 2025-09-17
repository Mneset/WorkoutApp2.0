const { op } = require('sequelize');

class WorkoutPlanService {
    constructor(db) {
        this.db = db;
    }

    async createWorkoutPlan(name, description, durationWeeks) {
        await this.db.WorkoutPlan.create({
            name: name,
            description: description,
            durationWeeks: durationWeeks
        });
    }

    async deleteWorkoutPlan() {
        
    }

    async updateWorkoutPlan() {
       
    }

    async getWorkoutPlanById() {
       
    }

    async startWorkoutPlan() {
        
    }

    async getCurrentPlanStatus() {

    }

    async getTodaysWorkout() {

    }

    async getExpectedSession() {
    
    }

    async startSessionFromTemplate() {

    }

    async advanceUserweek() {
 
    }
}

module.exports = WorkoutPlanService;


