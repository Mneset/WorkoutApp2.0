class ExerciseService {
    constructor(db) {
        this.db = db;
    }

    async getAllExercises() {
        const exercises = await this.db.Exercise.findAll({
                include: [
            {
                model: this.db.TargetMuscle,
                through: { attributes: [] }
            }
        ]
        })
        return exercises;
    }

    async getExerciseById(id) {
        const exercise = await this.db.Exercise.findByPk(id, {
            include: [
                {
                    model: this.db.TargetMuscle,
                    through: { attributes: [] }
                }
            ]
        });
        return exercise;
    }
}

module.exports = ExerciseService;

