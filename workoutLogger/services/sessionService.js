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
                // Create baseSets number of exercise logs (each representing one set)
                for (let i = 0; i < exerciseTemplate.baseSets; i++) {
                    exerciseLogPromises.push(
                        this.db.ExerciseLog.create({
                            exerciseId: exerciseTemplate.exerciseId,
                            setId: 1, // Default to normal set type (1 = normal)
                            reps: exerciseTemplate.baseReps,
                            weight: exerciseTemplate.baseWeight || 0,
                            notes: '',
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
        await this.db.SessionLog.update({
            notes: notes,
            sessionDateEnd: new Date(),
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
                        notes: log.notes
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