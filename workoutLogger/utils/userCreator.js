const db = require('../models');
const axios = require('axios');

const checkForUser = async (req, res, next) => {
    try {

        console.log('Checking for user...');
        
        const userId = req.auth.payload.sub;
        
        let user = await db.User.findByPk(userId);

        if(!user) {
            const accessToken = req.auth.token;

            const userInfoResponse = await axios.get('https://dev-n8xnfzfw0w26p6nq.us.auth0.com/userinfo', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const { email, nickname } = userInfoResponse.data;

            if (!user) {
                user = await db.User.create({
                    id: userId,
                    email: email || `${userId}@example.com`,
                    username: nickname || `user_${userId}`, 
                });
                console.log('User created:', user);
            }
        }
        req.user = user;
        next();
    } catch (error) {
        console.error('Error checking for user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = checkForUser;