const rateLimit = require('express-rate-limit');

// Rate limit for authentication endpoints (login, register)
// Disabled in test environment to avoid test suite throttling
const authLimiter = process.env.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 requests per window
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: 'Too many authentication attempts, please try again after 15 minutes.',
        details: []
      }
    });

// General rate limit for standard API endpoints
const apiLimiter = process.env.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: 'Rate limit exceeded, please slow down your requests.',
        details: []
      }
    });

module.exports = {
  authLimiter,
  apiLimiter
};
