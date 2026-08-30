class FavoriteExerciseService {
    constructor(db) {
        this.db = db;
    }

    // The exercise ids a user has favorited.
    async getByUser(userId) {
        const rows = await this.db.FavoriteExercise.findAll({
            where: { userId },
            attributes: ['exerciseId'],
        });
        return rows.map((r) => r.exerciseId);
    }

    async add(userId, exerciseId) {
        const [row] = await this.db.FavoriteExercise.findOrCreate({
            where: { userId, exerciseId },
        });
        return row;
    }

    async remove(userId, exerciseId) {
        return await this.db.FavoriteExercise.destroy({ where: { userId, exerciseId } });
    }
}

module.exports = FavoriteExerciseService;
