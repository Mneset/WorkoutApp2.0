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

    async deleteTemplate(id) {
        return await this.db.SessionTemplate.destroy({ where: { id: id } });
    }

    async updateTemplate(id, updateData) {
        const affectedRows = await this.db.SessionTemplate.update(
            updateData ,
            { where: { id: id } }
        );
        return affectedRows[0];
    }

    async getTemplateById(id) {
        const template = await this.db.SessionTemplate.findByPk(id);
        return template;
    }

    async getAllTemplates() {
        const templates = await this.db.SessionTemplate.findAll();
        return templates;
    }
}

module.exports = SessionTemplateService;