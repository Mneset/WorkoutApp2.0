'use strict';

module.exports = {
    async up(queryInterface) {
        const dropIndex = async (index) => {
            try {
                await queryInterface.sequelize.query(
                    `ALTER TABLE \`sessiontemplate\` DROP INDEX \`${index}\``
                );
            } catch (err) {
                
            }
        };
        await dropIndex('days_offset');
        await dropIndex('name');
    },

    async down(queryInterface, Sequelize) {
    },
};