class Sets {
    constructor(db) {
        this.db = db;
    }
       
    async getAllSetTypes() {
        try {
            const setTypes = await this.db.Set.findAll()
            return setTypes;
        } catch (error) {
            throw error;
        }
    }


}

module.exports = Sets;

