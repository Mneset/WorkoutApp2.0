const { Op } = require('sequelize');

class OneRepMaxService {
    constructor(db) {
        this.db = db;
    }

    // All of a user's saved 1RMs, with the exercise name for display.
    async getByUser(userId) {
        return await this.db.OneRepMax.findAll({
            where: { userId },
            include: [{ model: this.db.Exercise, attributes: ['id', 'name'] }],
            order: [['id', 'DESC']],
        });
    }

    // Create or update the 1RM for a (user, exercise) pair.
    async upsert(userId, exerciseId, oneRm) {
        const existing = await this.db.OneRepMax.findOne({ where: { userId, exerciseId } });
        if (existing) {
            existing.oneRm = oneRm;
            await existing.save();
            return existing;
        }
        return await this.db.OneRepMax.create({ userId, exerciseId, oneRm });
    }

    async remove(userId, exerciseId) {
        return await this.db.OneRepMax.destroy({ where: { userId, exerciseId } });
    }

    // Best estimated 1RM (Epley: w*(1+reps/30)) from the user's logged sets for an
    // exercise, using only sets in a reliable rep range (1–12). Null if no usable data.
    async estimateFromHistory(userId, exerciseId) {
        const logs = await this.db.ExerciseLog.findAll({
            where: {
                exerciseId,
                reps: { [Op.gt]: 0, [Op.lte]: 12 },
                weight: { [Op.gt]: 0 },
            },
            include: [{ model: this.db.SessionLog, where: { userId }, attributes: [] }],
            attributes: ['reps', 'weight'],
        });
        let best = null;
        for (const l of logs) {
            const est = Number(l.weight) * (1 + Number(l.reps) / 30);
            if (best === null || est > best) best = est;
        }
        return best === null ? null : Math.round(best * 10) / 10;
    }
}

module.exports = OneRepMaxService;
