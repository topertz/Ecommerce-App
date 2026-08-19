const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: 'Authentication required'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      message: 'Invalid authorization header'
    });
  }

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

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