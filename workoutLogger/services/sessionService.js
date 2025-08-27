class SessionService {
    constructor(db) {
        this.db = db;
    }

    async getSessionsByUserId(userId) {
        try {
            const sessions = await this.db.SessionLog.findAll({
                where: { userId: userId },
                include: [{
                    model: this.db.ExerciseLog,
                    include: [ this.db.Exercise ]
                }]
            });
            return sessions;
        } catch (error) {
            throw error;
        }
    }

    async getSessionById(id) {
        try {
            const session = await this.db.SessionLog.findOne({
                where: { id: id },
                include: [{
                    model: this.db.ExerciseLog,
                    include: [ this.db.Exercise ]
                }]
            });
            return session;
        } catch (error) {
            throw error;
        }
    }

    async startSession(userId) {
        try {
            const session = await this.db.SessionLog.create({
                userId,
                sessionDateStart: new Date()
            });
            return session;
        } catch (error) {
            throw error;  
        }     
    }

    async endSession(notes, sessionLogId, updatedLogs, name) {
    const t = await this.db.sequelize.transaction();
    try {
        await this.db.SessionLog.update({
            notes: notes,
            sessionDateEnd: new Date(),
            name: name
        }, {
            where: { id: sessionLogId },
            transaction: t
        });

        if (Array.isArray(updatedLogs)) {
            for (const log of updatedLogs) {
                await this.db.ExerciseLog.update(
                    {
                        reps: log.reps,
                        weight: log.weight,
                        notes: log.notes
                    },
                    {
                        where: { id: log.id },
                        transaction: t
                    }
                );
            }
        }

        await t.commit();
        return true;
    } catch (error) {
        await t.rollback();
        throw error;
    }
}

    async deleteSession(sessionLogId) {
        try {
            const session = await this.db.SessionLog.destroy({
                where: { id: sessionLogId }
            });
            return session;
        } catch (error) {
            throw error;
        }
    }
}


module.exports = SessionService;