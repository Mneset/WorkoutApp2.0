const { Op } = require('sequelize');

class ExerciseService {
    constructor(db) {
        this.db = db;
    }

    // Library exercises (created_by NULL) plus the requesting user's own creations. A user
    // never sees another user's custom exercises.
    async getAllExercises(userId) {
        const exercises = await this.db.Exercise.findAll({
                where: { [Op.or]: [{ createdBy: null }, { createdBy: userId || null }] },
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

    // All equipment and target muscles, for the custom-exercise create form.
    async getTaxonomy() {
        const [muscles, equipment] = await Promise.all([
            this.db.TargetMuscle.findAll({ attributes: ['id', 'name'], order: [['name', 'ASC']] }),
            this.db.Equipment.findAll({ attributes: ['id', 'name'], order: [['name', 'ASC']] }),
        ]);
        return { muscles, equipment };
    }

    // Create a custom exercise owned by the user. Marked basic so it shows in both the
    // "Basic" and "All" picker lists. Muscles are split into primary/secondary movers, and
    // equipment is linked via the join table.
    async createExercise({ name, type = 'strength', createdBy, primaryMuscleIds = [], secondaryMuscleIds = [], equipmentIds = [], instructions = [] }) {
        const steps = (Array.isArray(instructions) ? instructions : [])
            .map((s) => (s || '').trim())
            .filter(Boolean);
        const exercise = await this.db.Exercise.create({
            name: name.trim(),
            type: type === 'cardio' ? 'cardio' : 'strength',
            isBasic: true,
            createdBy,
            instructions: steps.length ? steps : null,
        });
        // Secondary ids win only where a muscle isn't already primary (no dupes).
        const primary = [...new Set((primaryMuscleIds || []).map(Number))];
        const secondary = [...new Set((secondaryMuscleIds || []).map(Number))].filter((id) => !primary.includes(id));
        for (const muscleId of primary) {
            await this.db.ExerciseTargetMuscle.create({ exerciseId: exercise.id, targetMuscleId: muscleId, isPrimary: true });
        }
        for (const muscleId of secondary) {
            await this.db.ExerciseTargetMuscle.create({ exerciseId: exercise.id, targetMuscleId: muscleId, isPrimary: false });
        }
        for (const equipmentId of [...new Set((equipmentIds || []).map(Number))]) {
            await this.db.ExerciseEquipment.create({ exerciseId: exercise.id, equipmentId });
        }
        // Return in the same shape as getAllExercises (through isPrimary) so the client can
        // drop it straight into the picker list.
        return this.db.Exercise.findByPk(exercise.id, {
            attributes: { exclude: ['instructions'] },
            include: [{ model: this.db.TargetMuscle, through: { attributes: ['isPrimary'] } }],
        });
    }

    // Delete a custom exercise, but only if it belongs to the requesting user (library
    // exercises can't be deleted this way).
    async deleteCustomExercise(id, userId) {
        const exercise = await this.db.Exercise.findByPk(id);
        if (!exercise || exercise.createdBy !== userId) return false;
        await exercise.destroy();
        return true;
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

