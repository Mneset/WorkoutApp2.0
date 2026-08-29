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

                if(sessionTemplate) {
                    if (sessionTemplate.workout_plan_id && user?.workoutPlanId) {
                        // Plan day: attribute the session to the active plan/week.
                        sessionData.sessionTemplateId = sessionTemplateId,
                        sessionData.weekNumber = user.currentWeek,
                        sessionData.workoutPlanId = user.workoutPlanId,
                        sessionData.name = `${sessionTemplate.name} - Week ${user.currentWeek}`
                    } else {
                        // Standalone template: just a named session, no plan attribution.
                        sessionData.name = sessionTemplate.name
                    }
                    // Carry the template's note into the started session as its starting note.
                    if (sessionTemplate.notes) sessionData.notes = sessionTemplate.notes
                }
            }
            
            const session = await this.db.SessionLog.create(sessionData)

            if(sessionTemplateId && sessionTemplate?.ExerciseTemplates) {
            const exerciseLogPromises = [];
            
            sessionTemplate.ExerciseTemplates.forEach(exerciseTemplate => {
                const isCardio = exerciseTemplate.Exercise?.type === 'cardio';

                // Prefer the per-set prescription; fall back to baseSets identical sets for
                // legacy templates saved before the `sets` column existed.
                const prescribedSets =
                    Array.isArray(exerciseTemplate.sets) && exerciseTemplate.sets.length > 0
                        ? exerciseTemplate.sets
                        : Array.from({ length: exerciseTemplate.baseSets }, () => ({
                              reps: exerciseTemplate.baseReps,
                              weight: exerciseTemplate.baseWeight,
                              durationSeconds: exerciseTemplate.baseDurationSeconds,
                              distance: exerciseTemplate.baseDistance,
                              rpe: exerciseTemplate.baseRpe,
                              rir: exerciseTemplate.baseRir,
                          }));

                prescribedSets.forEach(set => {
                    exerciseLogPromises.push(
                        this.db.ExerciseLog.create({
                            exerciseId: exerciseTemplate.exerciseId,
                            setId: 1, // Default to normal set type (1 = normal)
                            orderIndex: exerciseTemplate.orderIndex,
                            reps: isCardio ? null : (set.reps ?? null),
                            weight: isCardio ? null : (set.weight ?? 0),
                            durationSeconds: isCardio ? (set.durationSeconds ?? null) : null,
                            distance: isCardio ? (set.distance ?? null) : null,
                            notes: set.notes ?? '',
                            rpe: set.rpe ?? null,
                            rir: isCardio ? null : (set.rir ?? null),
                            sessionLogId: session.id
                        })
                    );
                });
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