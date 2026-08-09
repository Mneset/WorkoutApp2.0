class UserService {
    constructor(db) {
        this.db = db
    }

    async findUserById(id) {
        const user = await this.db.User.findByPk(id)

        return user
    }

    async getUserProfile(userId) {
       return await this.db.User.findOne({
        where: {id: userId},
        include: [
            {
                model: this.db.WorkoutPlan,
                include: [{ model: this.db.SessionTemplate }]
            }
        ]
       })
    }

    async getCurrentPlanStatus(userId) {
       const user = await this.db.User.findOne({
        where: {id: userId},
        include: [
            {model: this.db.WorkoutPlan}
        ]
       })

       if(!user) {
 
        return null
       }

       if(!user.workoutPlanId) {
        return null
       }

       return user
    }
}

module.exports = UserService