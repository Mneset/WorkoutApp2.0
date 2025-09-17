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
            { id: 1, username: 'testuser', email: 'test@example.com', role_id: 1 },
            { id: 2, username: 'admin', email: 'admin@example.com', role_id: 2 }
        ]);

        // Seed workout plans
        await db.WorkoutPlan.bulkCreate([
            { 
                id: 1, 
                name: 'Test Workout Plan', 
                description: 'A basic test workout plan', 
                duration_weeks: 4 
            }
        ]);

        // Seed session logs
        await db.SessionLog.bulkCreate([
            { id: 1, user_id: 1, workout_plan_id: 1 },
            { id: 2, user_id: 1, workout_plan_id: 1 }
        ]);

        // Seed exercise logs
        await db.ExerciseLog.bulkCreate([
            { id: 1, exercise_id: 1, sets_id: 1, session_log_id: 1 },
            { id: 2, exercise_id: 2, sets_id: 1, session_log_id: 1 },
            { id: 3, exercise_id: 3, sets_id: 1, session_log_id: 2 }
        ]);

        // Seed junction tables (many-to-many relationships)
        await db.ExerciseTargetMuscle.bulkCreate([
            { exercise_id: 1, target_muscle_id: 1 }, // Bench Press - Pectoralis Major
            { exercise_id: 1, target_muscle_id: 2 }, // Bench Press - Triceps
            { exercise_id: 2, target_muscle_id: 1 }, // Push-Up - Pectoralis Major
            { exercise_id: 3, target_muscle_id: 3 }, // Pull-Up - Latissimus Dorsi
            { exercise_id: 4, target_muscle_id: 4 }  // Squat - Quadriceps
        ]);

        await db.ExerciseCategory.bulkCreate([
            { exercise_id: 1, category_id: 1 }, // Bench Press - Strength
            { exercise_id: 2, category_id: 2 }, // Push-Up - Bodyweight
            { exercise_id: 3, category_id: 2 }, // Pull-Up - Bodyweight
            { exercise_id: 4, category_id: 1 }  // Squat - Strength
        ]);

        await db.ExerciseEquipment.bulkCreate([
            { exercise_id: 1, equipment_id: 1 }, // Bench Press - Barbell
            { exercise_id: 2, equipment_id: 3 }, // Push-Up - Bodyweight
            { exercise_id: 3, equipment_id: 4 }, // Pull-Up - Pull-Up Bar
            { exercise_id: 4, equipment_id: 1 }  // Squat - Barbell
        ]);

        console.log('Test data seeded successfully');
    } catch (error) {
        console.error('Error seeding test data:', error);
        throw error;
    }
};

module.exports = { seedTestDb };