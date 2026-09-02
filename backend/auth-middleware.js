const jwt = require('jsonwebtoken');
const db = require('./database');

function authenticateToken(req, res, next) {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Authentication required'
    });
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    return res.status(401).json({
      message: 'Invalid authorization header'
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not configured.');

    return res.status(500).json({
      message: 'Server authentication is not configured'
    });
  }

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ['HS256']
      }
    );

    const user = db
     .prepare(`
       SELECT id, username, role
       FROM users
       WHERE id = ?
      `)
      .get(decoded.id);

      if (!user) {
        return res.status(401).json({
          message: 'User no longer exists'
        });
      }

    req.user = user;

    next();

  } catch (error) {

    return res.status(401).json({
      message: 'Invalid or expired token'
    });

  }

}

function requireAdmin(req, res, next) {

  if (!req.user || req.user.role !== 'admin') {

    return res.status(403).json({
      message: 'Admin access required'
    });

  }

  next();

}

module.exports = {
  authenticateToken,
  requireAdmin
};