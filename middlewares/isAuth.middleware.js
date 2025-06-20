const jwt = require('jsonwebtoken');
require('dotenv').config();

const isAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Invalid token format' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.directorId = payload.directorId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

module.exports = isAuth;
