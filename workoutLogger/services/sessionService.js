// Resolve a prescribed set weight to the absolute kg placeholder. 'kg' exercises use the
// value directly; 'pct' exercises resolve against the user's 1RM (nearest 2.5 kg), or null
// when no 1RM is on file (the % caption still conveys the intent).
function computeTargetKg(weight, isPct, oneRm) {
    if (weight == null || weight === '') return null;
    if (!isPct) return String(Number(weight));
    if (!oneRm) return null;
    const kg = Math.round(((Number(oneRm) * Number(weight)) / 100) / 2.5) * 2.5;
    return String(kg);
}

// The percentage behind a 'pct' set (for the caption); null for kg exercises.
function computeTargetPct(weight, isPct) {
    if (isPct && weight != null && weight !== '') return Number(weight);
    return null;
}

// Applied to sets from a template saved before field_config existed. All fields on, which
// is what those sessions already did (a plan used to force every column on). The point of
// falling back to a concrete object rather than null is that null means "added freeform",
// and a legacy plan exercise is still an authored one.
const DEFAULT_FIELD_CONFIG = { showRpe: true, showRir: true, showNotes: true };

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
            let oneRmByExercise = {}

            if(sessionTemplateId) {
                const user = await this.db.User.findByPk(userId)
                sessionTemplate = await this.db.SessionTemplate.findByPk(sessionTemplateId, {
                    include: [{
                        model: this.db.ExerciseTemplate,
                        include: [this.db.Exercise]
                    }]
                })

                // 1RMs for resolving any percentage-based prescribed weights.
                const oneRmRows = await this.db.OneRepMax.findAll({ where: { userId } })
                oneRmByExercise = Object.fromEntries(oneRmRows.map(r => [r.exerciseId, r.oneRm]))

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
                    // The template's note is the *prescribed* session note, shown read-only
                    // while logging. It deliberately does not seed `notes`, which stays the
                    // lifter's own, so editing one never destroys the other.
                    if (sessionTemplate.notes) sessionData.targetNotes = sessionTemplate.notes
                }
            }
            
            // Create the session and its prescribed logs atomically — if any log insert
            // fails, the session row is rolled back so we never leave an orphaned
            // "in-progress" session (which would then block starting future sessions).
            return await this.db.sequelize.transaction(async (t) => {
            const session = await this.db.SessionLog.create(sessionData, { transaction: t })

            if(sessionTemplateId && sessionTemplate?.ExerciseTemplates) {
            const exerciseLogPromises = [];

            sessionTemplate.ExerciseTemplates.forEach(exerciseTemplate => {
                const isCardio = exerciseTemplate.Exercise?.type === 'cardio';
                const isPct = exerciseTemplate.weightUnit === 'pct';
                // Time-based (hold) strength prescription: sets carry a duration, not reps/weight.
                const timed = !isCardio && !!exerciseTemplate.isTimed;
                const dur = isCardio || timed; // logs a duration target, not reps/weight
                const oneRm = oneRmByExercise[exerciseTemplate.exerciseId];

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
                    // The prescription rides along as *targets* (shown as placeholders while
                    // logging); the actual reps/weight/time/distance start empty. RPE/RIR are
                    // pre-filled as the target and adjusted to actuals during the workout.
                    exerciseLogPromises.push(
                        this.db.ExerciseLog.create({
                            exerciseId: exerciseTemplate.exerciseId,
                            setId: 1, // Default to normal set type (1 = normal)
                            orderIndex: exerciseTemplate.orderIndex,
                            reps: null,
                            weight: null,
                            durationSeconds: null,
                            distance: null,
                            targetReps: dur ? null : (set.reps != null && set.reps !== '' ? String(set.reps) : null),
                            targetWeight: dur ? null : computeTargetKg(set.weight, isPct, oneRm),
                            targetWeightPct: dur ? null : computeTargetPct(set.weight, isPct),
                            targetDurationSeconds: dur ? (set.durationSeconds ?? null) : null,
                            targetDistance: isCardio ? (set.distance ?? null) : null,
                            // The lifter's own note starts empty; the plan's rides alongside.
                            notes: '',
                            targetNotes: set.notes ?? null,
                            targetExerciseNotes: exerciseTemplate.notes ?? null,
                            rpe: set.rpe ?? null,
                            rir: dur ? null : (set.rir ?? null),
                            isTimed: timed,
                            // Carried across so logging never has to read back a template the
                            // user may since have edited. Non-null also marks the set as
                            // authored, which is what locks its metric mode while logging.
                            fieldConfig: exerciseTemplate.fieldConfig ?? DEFAULT_FIELD_CONFIG,
                            sessionLogId: session.id
                        }, { transaction: t })
                    );
                });
            });

            await Promise.all(exerciseLogPromises);
        }

            return session
            })
        } catch (error) {
            throw error
        }
    }

    // Persist the session-level note/name mid-session WITHOUT ending it (endSession stamps
    // sessionDateEnd, which is what marks a session finished). Used to save the note on blur
    // so it isn't lost when you leave and resume the workout.
    async updateSessionInfo(sessionLogId, { notes, name }) {
        const fields = {};
        if (notes !== undefined) fields.notes = notes;
        if (name !== undefined) fields.name = name;
        if (Object.keys(fields).length === 0) return 0;
        const [affected] = await this.db.SessionLog.update(fields, { where: { id: sessionLogId } });
        return affected;
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