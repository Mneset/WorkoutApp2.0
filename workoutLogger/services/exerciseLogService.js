class ExerciseLogService {
    constructor(db) {
        this.db = db;
    }

    async addExerciseLogToSession(exerciseId, setId, reps, weight, notes, sessionLogId) {
        try {
            const exerciseLog = await this.db.ExerciseLog.create({
                exerciseId,
                setId,
                reps,
                weight,
                notes,
                sessionLogId
            })
            return exerciseLog
        } catch (error) {
            throw error;
        }
    }

    async updateExerciseLog(exerciseLogId, reps, weight, notes) {
        try {
            const exerciseLog = await this.db.ExerciseLog.update(
                { reps, weight, notes },
                { where: { id: exerciseLogId } }
            );
            return exerciseLog;
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
