class SessionTemplateService {
    constructor(db) {
        this.db = db
    }

    async createTemplate(name, dayOffset, workoutPlanId) {
        const newSessionTemplate = await this.db.SessionTemplate.create({
            name: name,
            dayOffset: dayOffset,
            workout_plan_id: workoutPlanId
        });
        return newSessionTemplate;
    }

    async deleteTemplate() {
        
    }

    async updateTemplate() {
        
    }

    async getTemplateById() {
        
    }   
}

module.exports = SessionTemplateService;