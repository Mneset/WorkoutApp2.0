'use strict';

// Plans can now carry free-text notes at two levels: a note per session day
// (sessiontemplate) and a note per prescribed exercise (exercisetemplate).
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('sessiontemplate', 'notes', {
            type: Sequelize.TEXT,
            allowNull: true,
        });
        await queryInterface.addColumn('exercisetemplate', 'notes', {
            type: Sequelize.TEXT,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('sessiontemplate', 'notes');
        await queryInterface.removeColumn('exercisetemplate', 'notes');
    },
};
