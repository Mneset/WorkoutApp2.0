class ExerciseService {
    constructor(db) {
        this.db = db;
    }

    async getAllExercises() {
        try {
            const exercises = await this.db.Exercise.findAll({
                 include: [
                {
                    model: this.db.TargetMuscle,
                    through: { attributes: [] }
                }
            ]
            })
            return exercises;
        } catch (error) {
            throw error;
        }
    }

}

module.exports = ExerciseService;

