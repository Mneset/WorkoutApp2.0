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
        // Check existence explicitly: MySQL's UPDATE affectedRows counts *changed* rows, so
        // saving an edit that only touched the plan's days (not name/description/weeks) would
        // otherwise look like "not found". Return 1 whenever the plan exists.
        const plan = await this.db.WorkoutPlan.findByPk(id);
        if (!plan) return 0;
        await this.db.WorkoutPlan.update(updateData, { where: { id: id } });
        return 1;
    }

    // Exercises across a plan prescribed by % of 1RM that the user has no 1RM for yet.
    async getMissingOneRepMax(planId, userId) {
        const plan = await this.db.WorkoutPlan.findByPk(planId, {
            include: [{
                model: this.db.SessionTemplate,
                include: [{
                    model: this.db.ExerciseTemplate,
                    where: { weightUnit: 'pct' },
                    required: false,
                    include: [{ model: this.db.Exercise, attributes: ['id', 'name'] }],
                }],
            }],
        });
        if (!plan) return [];
        const existing = await this.db.OneRepMax.findAll({ where: { userId } });
        const haveSet = new Set(existing.map((r) => r.exerciseId));
        const missing = new Map();
        for (const st of plan.SessionTemplates || []) {
            for (const et of st.ExerciseTemplates || []) {
                if (!haveSet.has(et.exerciseId) && !missing.has(et.exerciseId)) {
                    missing.set(et.exerciseId, { exerciseId: et.exerciseId, name: et.Exercise?.name || 'Exercise' });
                }
            }
        }
        return [...missing.values()];
    }

    async getWorkoutPlanById(id) {
        const plan = await this.db.WorkoutPlan.findByPk(id);
        return plan;
    }
    
    async getAllWorkoutPlans() {
        const plans = await this.db.WorkoutPlan.findAll({
                include: [{
                    model: this.db.SessionTemplate ,
                    include: [{
                        model: this.db.ExerciseTemplate,
                        include: [{
                            model: this.db.Exercise
                        }]
                    }]
                }]
        });

        console.log(plans)
 
        return plans;
    }

    async startWorkoutPlan(userId, workoutPlanId, startDate) {
        const [rowsUpdated] = await this.db.User.update({
           workoutPlanId: workoutPlanId,
            planStartDate: startDate,
            currentWeek: 1
        }, {
            where: { id: userId },
        });

        return rowsUpdated;
    }

    async quitWorkoutPlan(userId) {
        const [rowsUpdated] = await this.db.User.update({
            workoutPlanId: null,
            planStartDate: null,
            currentWeek: 1
        }, {
            where: { id: userId },
        });

        return rowsUpdated;
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


