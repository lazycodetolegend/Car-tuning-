const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - verifies JWT Bearer token
 */
const authenticate = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      error: 'Not authorized: Missing token'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.sub || decoded.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        error: 'Not authorized: User no longer exists'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Not authorized: Invalid or expired token'
    });
  }
};

/**
 * Admin role authorization
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden: Admin privilege required'
    });
  }
  next();
};

/**
 * Optional authentication - attaches user if token is valid, continues if not
 */
const optionalAuth = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.sub || decoded.id;
    const user = await User.findById(userId);
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Ignore error for optional auth
  }

  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  optionalAuth
};
