class ExerciseLogService {
    constructor(db) {
        this.db = db;
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
