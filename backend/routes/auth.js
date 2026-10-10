const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * Generate JWT Token helper
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      sub: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post(
  '/register',
  authLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores and dashes'),
    body('firstName').optional().trim(),
    body('lastName').optional().trim()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password, username, firstName, lastName } = req.body;

      // Check for existing email (409 Conflict)
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(409).json({
          error: 'An account with this email address already exists'
        });
      }

      // Check for existing username (409 Conflict)
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(409).json({
          error: 'Username is already taken'
        });
      }

      // Hash password with bcrypt cost 12
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await User.create({
        email,
        passwordHash,
        username,
        firstName: firstName || '',
        lastName: lastName || '',
        lastLoginAt: new Date()
      });

      const token = generateToken(user);

      res.status(201).json({
        token,
        user
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post(
  '/login',
  authLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Select passwordHash explicitly as it is select: false
      const user = await User.findOne({ email }).select('+passwordHash');
      if (!user) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      // Update last login timestamp
      user.lastLoginAt = new Date();
      await user.save();

      const token = generateToken(user);

      res.status(200).json({
        token,
        user
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', authenticate, (req, res) => {
  res.status(200).json(req.user);
});

// @route   PATCH /api/auth/me
// @desc    Update current user profile (firstName, lastName, avatarUrl only)
// @access  Private
router.patch(
  '/me',
  authenticate,
  [
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('avatarUrl').optional().trim().isURL().withMessage('Avatar must be a valid URL')
  ],
  validate,
  async (req, res, next) => {
    try {
      const allowedUpdates = ['firstName', 'lastName', 'avatarUrl'];
      const user = req.user;

      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
          user[field] = req.body[field];
        }
      });

      await user.save();

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
