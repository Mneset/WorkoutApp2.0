class ExerciseService {
    constructor(db) {
        this.db = db;
    }

    async getAllExercises() {
        const exercises = await this.db.Exercise.findAll({
                // Instructions are large and lazy-loaded; images (a couple of short paths)
                // stay so the list can show a thumbnail.
                attributes: { exclude: ['instructions'] },
                include: [
            {
                model: this.db.TargetMuscle,
                through: { attributes: ['isPrimary'] }
            }
        ]
        })
        return exercises;
    }

    // Lazy-loaded detail (step-by-step instructions + image paths) for one exercise.
    async getExerciseDetails(id) {
        return await this.db.Exercise.findByPk(id, {
            attributes: ['id', 'name', 'instructions', 'images'],
        });
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

