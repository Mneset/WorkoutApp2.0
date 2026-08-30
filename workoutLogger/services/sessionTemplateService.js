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

    // Exercises in a template that are prescribed by % of 1RM but for which the user has
    // no 1RM on file yet — so a session start can require them first.
    async getMissingOneRepMax(templateId, userId) {
        const template = await this.db.SessionTemplate.findByPk(templateId, {
            include: [{
                model: this.db.ExerciseTemplate,
                where: { weightUnit: 'pct' },
                required: false,
                include: [{ model: this.db.Exercise, attributes: ['id', 'name'] }],
            }],
        });
        const pctExercises = template ? (template.ExerciseTemplates || []) : [];
        if (pctExercises.length === 0) return [];
        const existing = await this.db.OneRepMax.findAll({ where: { userId } });
        const haveSet = new Set(existing.map((r) => r.exerciseId));
        const missing = new Map();
        for (const et of pctExercises) {
            if (!haveSet.has(et.exerciseId) && !missing.has(et.exerciseId)) {
                missing.set(et.exerciseId, { exerciseId: et.exerciseId, name: et.Exercise?.name || 'Exercise' });
            }
        }
        return [...missing.values()];
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