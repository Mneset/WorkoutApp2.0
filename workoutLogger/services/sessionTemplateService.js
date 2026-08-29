class SessionTemplateService {
    constructor(db) {
        this.db = db
    }

    async createTemplate(name, dayOffset, workoutPlanId, notes = null, userId = null) {
        const newSessionTemplate = await this.db.SessionTemplate.create({
            name: name,
            dayOffset: dayOffset ?? 0,
            workout_plan_id: workoutPlanId ?? null,
            userId: userId ?? null,
            notes: notes
        });
        return newSessionTemplate;
    }

    // Standalone templates a user owns (not attached to any plan), with their exercises.
    async getStandaloneTemplatesByUser(userId) {
        return await this.db.SessionTemplate.findAll({
            where: { userId: userId, workout_plan_id: null },
            include: [{
                model: this.db.ExerciseTemplate,
                include: [this.db.Exercise]
            }],
            order: [['id', 'DESC']]
        });
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