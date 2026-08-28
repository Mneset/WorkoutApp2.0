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

    /* async startSession(userId) {
        try {
            const session = await this.db.SessionLog.create({
                userId,
                sessionDateStart: new Date()
            });
            return session;
        } catch (error) {
            throw error;  
        }     
    } */

    async startSession(userId, sessionTemplateId = null) {
        try {
            let sessionData = {
                userId: userId,
                sessionDateStart: new Date() 
            }

            let sessionTemplate = null

            if(sessionTemplateId) {
                const user = await this.db.User.findByPk(userId)
                sessionTemplate = await this.db.SessionTemplate.findByPk(sessionTemplateId, {
                    include: [{
                        model: this.db.ExerciseTemplate,
                        include: [this.db.Exercise]
                    }]
                })

                if(sessionTemplate && user.workoutPlanId) {
                    sessionData.sessionTemplateId = sessionTemplateId,
                    sessionData.weekNumber = user.currentWeek,
                    sessionData.workoutPlanId = user.workoutPlanId,
                    sessionData.name = `${sessionTemplate.name} - Week ${user.currentWeek}`
                } 
            }
            
            const session = await this.db.SessionLog.create(sessionData)

            if(sessionTemplateId && sessionTemplate?.ExerciseTemplates) {
            const exerciseLogPromises = [];
            
            sessionTemplate.ExerciseTemplates.forEach(exerciseTemplate => {
                const isCardio = exerciseTemplate.Exercise?.type === 'cardio';
                // Create baseSets number of exercise logs (each representing one set)
                for (let i = 0; i < exerciseTemplate.baseSets; i++) {
                    exerciseLogPromises.push(
                        this.db.ExerciseLog.create({
                            exerciseId: exerciseTemplate.exerciseId,
                            setId: 1, // Default to normal set type (1 = normal)
                            orderIndex: exerciseTemplate.orderIndex,
                            reps: isCardio ? null : exerciseTemplate.baseReps,
                            weight: isCardio ? null : (exerciseTemplate.baseWeight || 0),
                            durationSeconds: isCardio ? (exerciseTemplate.baseDurationSeconds ?? null) : null,
                            distance: isCardio ? (exerciseTemplate.baseDistance ?? null) : null,
                            notes: '',
                            rpe: exerciseTemplate.baseRpe ?? null,
                            rir: isCardio ? null : (exerciseTemplate.baseRir ?? null),
                            sessionLogId: session.id
                        })
                    );
                }
            });

            await Promise.all(exerciseLogPromises);
        }

            return session 
        } catch (error) {
            throw error
        }
    }

    async endSession(notes, sessionLogId, updatedLogs, name) {
    try {
        // Finish stamps the end date once; editing a session that's already finished
        // must keep its original end date (COALESCE), not move it to "now".
        const existing = await this.db.SessionLog.findByPk(sessionLogId);
        const endDate = existing?.sessionDateEnd || new Date();

        await this.db.SessionLog.update({
            notes: notes,
            sessionDateEnd: endDate,
            name: name
        }, {
            where: { id: sessionLogId },
        });

        if (Array.isArray(updatedLogs)) {
            for (const log of updatedLogs) {
                await this.db.ExerciseLog.update(
                    {
                        reps: log.reps,
                        weight: log.weight,
                        durationSeconds: log.durationSeconds,
                        distance: log.distance,
                        notes: log.notes,
                        rpe: log.rpe,
                        rir: log.rir
                    },
                    {
                        where: { id: log.id },
                    }
                );
            }
        }
        return true;
    } catch (error) {
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
            throw error
        }
    }
}


module.exports = SessionService;