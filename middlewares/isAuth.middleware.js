const jwt = require('jsonwebtoken');
require('dotenv').config();

const isAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload || !payload.id) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
    }

    req.user = payload;        
    req.userId = payload.id;   

    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

module.exports = isAuth;
