class WorkoutPlanService {
    constructor(db) {
        this.db = db;
    }

    async createWorkoutPlan(name, description, durationWeeks) {
       const plan = await this.db.WorkoutPlan.create({
            name: name,
            description: description,
            durationWeeks: durationWeeks
        });
        return plan;
    }

    async deleteWorkoutPlan(id) {
        return await this.db.WorkoutPlan.destroy({ where: { id: id } });
    }

    async updateWorkoutPlan(id, updateData) {
       const affectedRows = await this.db.WorkoutPlan.update(updateData,
            { where: { id: id } }
        );
        return affectedRows[0];
    }

    async getWorkoutPlanById(id) {
        const plan = await this.db.WorkoutPlan.findByPk(id);
        return plan;
    }
    
    async getAllWorkoutPlans() {
        const plans = await this.db.WorkoutPlan.findAll();
        return plans;
    }

    async startWorkoutPlan(workoutPlanId, userId, startDate) {
        await this.db.User.update({
                workoutPlanId: workoutPlanId,
                planStartDate: startDate,
                currentWeek: 1
        }, {
            where: { id: userId },
        });

        const user = await this.db.User.findOne({
            where: {id: userId},
            include: [
                {model: this.db.workoutPlan}
            ]  
        })

        return user
    }

    async getCurrentPlanStatus(userId) {
       const user = await this.db.User.findOne({
        where: {id: userId},
        include: [
            {model: this.db.workoutPlan}
        ]
       })

       if(!user.workoutPlanId) {
        return null
       }

       return user
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


