class UserService {
    constructor(db) {
        this.db = db
    }

    async findUserById(id) {
        const user = await this.db.User.findByPk(id)

        return user
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