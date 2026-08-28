class ExerciseTemplateService {
    constructor(db) {
        this.db = db
    }

    async getAllExerciseTemplates() {
        const exerciseTemplates = await this.db.ExerciseTemplate.findAll()
        return exerciseTemplates;
    }

    async getExerciseTemplateeById(id) {
        const exerciseTemplate = await this.db.Exercise.findByPk(id);
        return exerciseTemplate;
    }
    
    // data: { sessionTemplateId, exerciseId, orderIndex, baseSets, baseReps, baseWeight,
    //         baseDurationSeconds, baseDistance, baseRpe, baseRir }
    async addExerciseTemplate(data) {
        return await this.db.ExerciseTemplate.create(data);
    }

    async updateExerciseTemplate(id, updateData) {
        const affectedRows = await this.db.ExerciseTemplate.update(updateData, {
            where: { id: id },
        });
        return affectedRows[0];
        
    }

    async deleteExerciseTemplate(id) {
        const deletedRows = await this.db.ExerciseTemplate.destroy({
            where: { id: id },
        });
        return deletedRows;
    }
}

module.exports = ExerciseTemplateService;