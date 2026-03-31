'use strict';

module.exports = {
    async up(queryInterface) {
        // Roles
        await queryInterface.bulkInsert('role', [
            { name: 'User' },
            { name: 'Admin' },
        ]);

        // Exercises
        await queryInterface.bulkInsert('exercises', [
            { name: 'Bench Press' },
            { name: 'Push-Up' },
            { name: 'Incline Dumbbell Press' },
            { name: 'Chest Fly' },
            { name: 'Cable Crossover' },
            { name: 'Pull-Up' },
            { name: 'Deadlift' },
            { name: 'Bent-Over Row' },
            { name: 'Lat Pulldown' },
            { name: 'Seated Cable Row' },
            { name: 'Squat' },
            { name: 'Leg Press' },
            { name: 'Lunges' },
            { name: 'Leg Curl' },
            { name: 'Calf Raise' },
            { name: 'Incline Bench Press' },
            { name: 'Incline Chest Press' },
            { name: 'Hack Squat' },
            { name: 'Stiff-Legged Deadlift' },
            { name: 'Chest Supported Pulldown (Narrow Grip)' },
            { name: 'Chest Supported Row (Wide Grip)' },
            { name: 'Lateral Raise (Cable)' },
            { name: 'Super ROM Lateral Raise' },
            { name: 'Upright Row (Cable)' },
            { name: 'Upright Row (Dumbbell)' },
            { name: 'Y-Raise (Cable)' },
        ]);

        // Target Muscles
        await queryInterface.bulkInsert('targetmuscles', [
            { name: 'Pectoralis Major' },
            { name: 'Triceps' },
            { name: 'Latissimus Dorsi' },
            { name: 'Trapezius' },
            { name: 'Biceps' },
            { name: 'Quadriceps' },
            { name: 'Hamstrings' },
            { name: 'Calves' },
            { name: 'Glutes' },
            { name: 'Deltoids' },
        ]);

        // Categories
        await queryInterface.bulkInsert('categories', [
            { name: 'Strength' },
            { name: 'Bodyweight' },
            { name: 'Hypertrophy' },
            { name: 'Powerlifting' },
            { name: 'Isolation' },
        ]);

        // Equipment
        await queryInterface.bulkInsert('equipment', [
            { name: 'Barbell' },
            { name: 'Dumbbells' },
            { name: 'Bodyweight' },
            { name: 'Cable Machine' },
            { name: 'Pull-Up Bar' },
            { name: 'Leg Press Machine' },
            { name: 'Bench' },
            { name: 'Machine' },
        ]);

        // Sets
        await queryInterface.bulkInsert('sets', [
            { name: 'Normal Set' },
            { name: 'Myo-Reps' },
            { name: 'Drop Set' },
            { name: 'Superset' },
            { name: 'Giant Set' },
            { name: 'Pyramid Set' },
            { name: 'Rest-Pause Set' },
            { name: 'Cluster Set' },
        ]);

        // Exercise <-> Target Muscles
        await queryInterface.bulkInsert('exercisetargetmuscles', [
            // Bench Press
            { exercise_id: 1, targetMuscle_id: 1 }, { exercise_id: 1, targetMuscle_id: 2 },
            // Push-Up
            { exercise_id: 2, targetMuscle_id: 1 }, { exercise_id: 2, targetMuscle_id: 2 },
            // Incline Dumbbell Press
            { exercise_id: 3, targetMuscle_id: 1 }, { exercise_id: 3, targetMuscle_id: 2 },
            // Chest Fly
            { exercise_id: 4, targetMuscle_id: 1 },
            // Cable Crossover
            { exercise_id: 5, targetMuscle_id: 1 },
            // Pull-Up
            { exercise_id: 6, targetMuscle_id: 3 }, { exercise_id: 6, targetMuscle_id: 5 },
            // Deadlift
            { exercise_id: 7, targetMuscle_id: 3 }, { exercise_id: 7, targetMuscle_id: 7 }, { exercise_id: 7, targetMuscle_id: 9 },
            // Bent-Over Row
            { exercise_id: 8, targetMuscle_id: 3 }, { exercise_id: 8, targetMuscle_id: 4 }, { exercise_id: 8, targetMuscle_id: 5 },
            // Lat Pulldown
            { exercise_id: 9, targetMuscle_id: 3 }, { exercise_id: 9, targetMuscle_id: 5 },
            // Seated Cable Row
            { exercise_id: 10, targetMuscle_id: 3 }, { exercise_id: 10, targetMuscle_id: 4 }, { exercise_id: 10, targetMuscle_id: 5 },
            // Squat
            { exercise_id: 11, targetMuscle_id: 6 }, { exercise_id: 11, targetMuscle_id: 7 }, { exercise_id: 11, targetMuscle_id: 9 },
            // Leg Press
            { exercise_id: 12, targetMuscle_id: 6 }, { exercise_id: 12, targetMuscle_id: 7 }, { exercise_id: 12, targetMuscle_id: 9 },
            // Lunges
            { exercise_id: 13, targetMuscle_id: 6 }, { exercise_id: 13, targetMuscle_id: 7 }, { exercise_id: 13, targetMuscle_id: 9 },
            // Leg Curl
            { exercise_id: 14, targetMuscle_id: 7 },
            // Calf Raise
            { exercise_id: 15, targetMuscle_id: 8 },
            // Incline Bench Press
            { exercise_id: 16, targetMuscle_id: 1 }, { exercise_id: 16, targetMuscle_id: 2 },
            // Incline Chest Press
            { exercise_id: 17, targetMuscle_id: 1 }, { exercise_id: 17, targetMuscle_id: 2 },
            // Hack Squat
            { exercise_id: 18, targetMuscle_id: 6 }, { exercise_id: 18, targetMuscle_id: 7 }, { exercise_id: 18, targetMuscle_id: 9 },
            // Stiff-Legged Deadlift
            { exercise_id: 19, targetMuscle_id: 7 }, { exercise_id: 19, targetMuscle_id: 9 },
            // Chest Supported Pulldown
            { exercise_id: 20, targetMuscle_id: 3 }, { exercise_id: 20, targetMuscle_id: 4 }, { exercise_id: 20, targetMuscle_id: 5 },
            // Chest Supported Row
            { exercise_id: 21, targetMuscle_id: 3 }, { exercise_id: 21, targetMuscle_id: 4 }, { exercise_id: 21, targetMuscle_id: 5 },
            // Lateral Raise (Cable)
            { exercise_id: 22, targetMuscle_id: 10 },
            // Super ROM Lateral Raise
            { exercise_id: 23, targetMuscle_id: 10 }, { exercise_id: 23, targetMuscle_id: 4 },
            // Upright Row (Cable)
            { exercise_id: 24, targetMuscle_id: 10 }, { exercise_id: 24, targetMuscle_id: 4 },
            // Upright Row (Dumbbell)
            { exercise_id: 25, targetMuscle_id: 10 }, { exercise_id: 25, targetMuscle_id: 4 },
            // Y-Raise (Cable)
            { exercise_id: 26, targetMuscle_id: 10 }, { exercise_id: 26, targetMuscle_id: 4 },
        ]);

        // Exercise <-> Categories
        await queryInterface.bulkInsert('exercisecategories', [
            { exercise_id: 1, category_id: 1 }, { exercise_id: 1, category_id: 4 },
            { exercise_id: 2, category_id: 2 }, { exercise_id: 2, category_id: 1 },
            { exercise_id: 3, category_id: 1 }, { exercise_id: 3, category_id: 3 },
            { exercise_id: 4, category_id: 3 }, { exercise_id: 4, category_id: 5 },
            { exercise_id: 5, category_id: 3 }, { exercise_id: 5, category_id: 5 },
            { exercise_id: 6, category_id: 2 }, { exercise_id: 6, category_id: 1 },
            { exercise_id: 7, category_id: 1 }, { exercise_id: 7, category_id: 4 },
            { exercise_id: 8, category_id: 1 }, { exercise_id: 8, category_id: 3 },
            { exercise_id: 9, category_id: 3 },
            { exercise_id: 10, category_id: 3 },
            { exercise_id: 11, category_id: 1 }, { exercise_id: 11, category_id: 4 },
            { exercise_id: 12, category_id: 1 }, { exercise_id: 12, category_id: 3 },
            { exercise_id: 13, category_id: 1 }, { exercise_id: 13, category_id: 3 },
            { exercise_id: 14, category_id: 3 }, { exercise_id: 14, category_id: 5 },
            { exercise_id: 15, category_id: 3 }, { exercise_id: 15, category_id: 5 },
            { exercise_id: 16, category_id: 1 }, { exercise_id: 16, category_id: 3 }, { exercise_id: 16, category_id: 4 },
            { exercise_id: 17, category_id: 1 }, { exercise_id: 17, category_id: 3 },
            { exercise_id: 18, category_id: 1 }, { exercise_id: 18, category_id: 3 },
            { exercise_id: 19, category_id: 1 }, { exercise_id: 19, category_id: 3 },
            { exercise_id: 20, category_id: 1 }, { exercise_id: 20, category_id: 3 },
            { exercise_id: 21, category_id: 1 }, { exercise_id: 21, category_id: 3 },
            { exercise_id: 22, category_id: 3 }, { exercise_id: 22, category_id: 5 },
            { exercise_id: 23, category_id: 3 }, { exercise_id: 23, category_id: 5 },
            { exercise_id: 24, category_id: 3 }, { exercise_id: 24, category_id: 5 },
            { exercise_id: 25, category_id: 3 }, { exercise_id: 25, category_id: 5 },
            { exercise_id: 26, category_id: 3 }, { exercise_id: 26, category_id: 4 },
        ]);

        // Exercise <-> Equipment
        await queryInterface.bulkInsert('exerciseequipment', [
            { exercise_id: 1, equipment_id: 1 }, { exercise_id: 1, equipment_id: 7 },
            { exercise_id: 2, equipment_id: 3 },
            { exercise_id: 3, equipment_id: 2 }, { exercise_id: 3, equipment_id: 7 },
            { exercise_id: 4, equipment_id: 2 },
            { exercise_id: 5, equipment_id: 4 },
            { exercise_id: 6, equipment_id: 5 },
            { exercise_id: 7, equipment_id: 1 },
            { exercise_id: 8, equipment_id: 1 },
            { exercise_id: 9, equipment_id: 4 },
            { exercise_id: 10, equipment_id: 4 },
            { exercise_id: 11, equipment_id: 1 },
            { exercise_id: 12, equipment_id: 6 },
            { exercise_id: 13, equipment_id: 2 },
            { exercise_id: 14, equipment_id: 6 },
            { exercise_id: 15, equipment_id: 3 },
            { exercise_id: 16, equipment_id: 1 }, { exercise_id: 16, equipment_id: 7 },
            { exercise_id: 17, equipment_id: 8 },
            { exercise_id: 18, equipment_id: 8 },
            { exercise_id: 19, equipment_id: 1 },
            { exercise_id: 20, equipment_id: 8 },
            { exercise_id: 21, equipment_id: 8 },
            { exercise_id: 22, equipment_id: 4 },
            { exercise_id: 23, equipment_id: 2 },
            { exercise_id: 24, equipment_id: 4 },
            { exercise_id: 25, equipment_id: 2 },
            { exercise_id: 26, equipment_id: 4 },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete('exerciseequipment', null, {});
        await queryInterface.bulkDelete('exercisecategories', null, {});
        await queryInterface.bulkDelete('exercisetargetmuscles', null, {});
        await queryInterface.bulkDelete('sets', null, {});
        await queryInterface.bulkDelete('categories', null, {});
        await queryInterface.bulkDelete('targetmuscles', null, {});
        await queryInterface.bulkDelete('equipment', null, {});
        await queryInterface.bulkDelete('exercises', null, {});
        await queryInterface.bulkDelete('role', null, {});
    },
};
