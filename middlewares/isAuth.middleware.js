const jwt = require('jsonwebtoken')
require('dotenv').config()

const isAuth = (req, res, next) => {
  try {
    let token = req.headers['authorization']?.split(' ')[1]

    if (!token && req.query?.token) {
      token = req.query.token
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' })
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET)

    if (!payload || !payload.id) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token payload' })
    }

    req.user = payload
    req.userId = payload.id

    next()
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' })
  }
}

module.exports = isAuth
