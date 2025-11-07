const jwt = require('jsonwebtoken');
require('dotenv').config();

const isAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        req.userId = payload.id; 

        req.user = payload;

        next();
    } catch (error) {
        console.error('JWT verification failed:', error);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

module.exports = isAuth;
