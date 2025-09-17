const seedTestDb = async (db) => {
    try {
        // Seed exercises
        await db.Exercise.bulkCreate([
            { id: 1, name: 'Bench Press' },
            { id: 2, name: 'Push-Up' },
            { id: 3, name: 'Pull-Up' },
            { id: 4, name: 'Squat' },
            { id: 5, name: 'Deadlift' }
        ]);

        // Seed target muscles
        await db.TargetMuscle.bulkCreate([
            { id: 1, name: 'Pectoralis Major' },
            { id: 2, name: 'Triceps' },
            { id: 3, name: 'Latissimus Dorsi' },
            { id: 4, name: 'Quadriceps' },
            { id: 5, name: 'Hamstrings' }
        ]);

        // Seed categories
        await db.Category.bulkCreate([
            { id: 1, name: 'Strength' },
            { id: 2, name: 'Bodyweight' },
            { id: 3, name: 'Hypertrophy' },
            { id: 4, name: 'Powerlifting' }
        ]);

        // Seed equipment
        await db.Equipment.bulkCreate([
            { id: 1, name: 'Barbell' },
            { id: 2, name: 'Dumbbells' },
            { id: 3, name: 'Bodyweight' },
            { id: 4, name: 'Pull-Up Bar' }
        ]);

        // Seed sets
        await db.Set.bulkCreate([
            { id: 1, name: 'Normal Set' },
            { id: 2, name: 'Drop Set' },
            { id: 3, name: 'Superset' }
        ]);

        // Seed roles
        await db.Role.bulkCreate([
            { id: 1, name: 'User' },
            { id: 2, name: 'Admin' }
        ]);

        // Seed users
        await db.User.bulkCreate([
            { id: 1, username: 'testuser', email: 'test@example.com', roleId: 1 }, // Changed role_id to roleId
            { id: 2, username: 'admin', email: 'admin@example.com', roleId: 2 }
        ]);

        // Seed workout plans
        await db.WorkoutPlan.bulkCreate([
            { 
                id: 1, 
                name: 'Test Workout Plan', 
                description: 'A basic test workout plan', 
                durationWeeks: 4 
            }
        ]);

        // Seed session logs
        await db.SessionLog.bulkCreate([
            { id: 1, userId: 1, workoutPlanId: 1 }, // Changed user_id to userId, workout_plan_id to workoutPlanId
            { id: 2, userId: 1, workoutPlanId: 1 }
        ]);

        // Seed exercise logs
        await db.ExerciseLog.bulkCreate([
            { id: 1, exerciseId: 1, setId: 1, reps: 10, weight: 135, notes: 'Good form', sessionLogId: 1 },
            { id: 2, exerciseId: 2, setId: 1, reps: 15, weight: 0, notes: 'Push-ups felt easy', sessionLogId: 1 },
            { id: 3, exerciseId: 3, setId: 1, reps: 8, weight: 0, notes: 'Need to improve', sessionLogId: 2 }
        ]);

        // Seed junction tables (many-to-many relationships)
        await db.ExerciseTargetMuscle.bulkCreate([
            { exerciseId: 1, targetMuscleId: 1 }, // Changed to camelCase
            { exerciseId: 1, targetMuscleId: 2 },
            { exerciseId: 2, targetMuscleId: 1 },
            { exerciseId: 3, targetMuscleId: 3 },
            { exerciseId: 4, targetMuscleId: 4 }
        ]);

        await db.ExerciseCategory.bulkCreate([
            { exerciseId: 1, categoryId: 1 }, // Changed to camelCase
            { exerciseId: 2, categoryId: 2 },
            { exerciseId: 3, categoryId: 2 },
            { exerciseId: 4, categoryId: 1 }
        ]);

        await db.ExerciseEquipment.bulkCreate([
            { exerciseId: 1, equipmentId: 1 }, // Changed to camelCase
            { exerciseId: 2, equipmentId: 3 },
            { exerciseId: 3, equipmentId: 4 },
            { exerciseId: 4, equipmentId: 1 }
        ]);

        console.log('Test data seeded successfully');
    } catch (error) {
        console.error('Error seeding test data:', error);
        throw error;
    }
};

module.exports = { seedTestDb };