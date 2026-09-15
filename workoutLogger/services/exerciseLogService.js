const { Op } = require('sequelize');

class ExerciseLogService {
    constructor(db) {
        this.db = db;
    }

    // For each exercise id, the sets logged the last time this user did it in a *finished*
    // session (excluding the session currently being logged/edited). Returns a map keyed by
    // exercise id: { date, sets: [{ reps, weight, rpe, rir, durationSeconds, distance }] }.
    async getLastPerformances(userId, exerciseIds, excludeSessionId = null) {
        const result = {};
        for (const exerciseId of exerciseIds) {
            // Most recent finished session that logged this exercise.
            const latest = await this.db.ExerciseLog.findOne({
                where: {
                    exerciseId,
                    ...(excludeSessionId ? { sessionLogId: { [Op.ne]: excludeSessionId } } : {}),
                },
                include: [{
                    model: this.db.SessionLog,
                    required: true,
                    attributes: ['id', 'sessionDateEnd'],
                    where: { userId, sessionDateEnd: { [Op.ne]: null } },
                }],
                order: [[this.db.SessionLog, 'sessionDateEnd', 'DESC']],
            });
            if (!latest) continue;

            const sets = await this.db.ExerciseLog.findAll({
                where: { exerciseId, sessionLogId: latest.sessionLogId },
                attributes: ['reps', 'weight', 'rpe', 'rir', 'durationSeconds', 'distance', 'orderIndex'],
                order: [['orderIndex', 'ASC'], ['id', 'ASC']],
            });
            result[exerciseId] = {
                date: latest.SessionLog.sessionDateEnd,
                sets: sets.map((s) => ({
                    reps: s.reps,
                    weight: s.weight,
                    rpe: s.rpe,
                    rir: s.rir,
                    durationSeconds: s.durationSeconds,
                    distance: s.distance,
                })),
            };
        }
        return result;
    }

    // data: { exerciseId, setId, reps, weight, durationSeconds, distance, notes, rpe, rir, sessionLogId }
    async addExerciseLogToSession(data) {
        try {
            return await this.db.ExerciseLog.create(data);
        } catch (error) {
            throw error;
        }
    }

    // data: { reps, weight, durationSeconds, distance, notes, rpe, rir }
    async updateExerciseLog(exerciseLogId, data) {
        try {
            return await this.db.ExerciseLog.update(data, { where: { id: exerciseLogId } });
        } catch (error) {
            throw error;
        }
    }

    async deleteExerciseLog(exerciseLogId) {
        try {
            const deleted = await this.db.ExerciseLog.destroy({
                where: { id: exerciseLogId }
            });
            return deleted > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ExerciseLogService;
