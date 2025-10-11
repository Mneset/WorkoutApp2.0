class UserService {
    constructor(db) {
        this.db = db
    }

    async getCurrentPlanStatus(userId) {
       const user = await this.db.User.findOne({
        where: {id: userId},
        include: [
            {model: this.db.workoutPlan}
        ]
       })

       if(!user.workoutPlanId) {
        return null
       }

       return user
    }
}