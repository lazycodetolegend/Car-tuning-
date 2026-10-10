const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../config/firebase');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

// @desc    Register user with Firebase
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('username').isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores')
], asyncHandler(async (req, res, next) => {
  const { email, password, firstName, lastName, username } = req.body;

  // Check if user already exists in our database
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return next(new ErrorResponse('Email already registered', 400));
  }

  const existingUsername = await User.findByUsername(username);
  if (existingUsername) {
    return next(new ErrorResponse('Username already taken', 400));
  }

  try {
    // Create user in Firebase Auth
    const firebaseUser = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      emailVerified: false
    });

    // Create user in our database
    const user = await User.create({
      id: firebaseUser.uid,
      email,
      firstName,
      lastName,
      username,
      isEmailVerified: false
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        uid: firebaseUser.uid,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      return next(new ErrorResponse('Email already registered', 400));
    }
    if (error.code === 'auth/weak-password') {
      return next(new ErrorResponse('Password is too weak', 400));
    }
    return next(new ErrorResponse('Registration failed', 500));
  }
}));

// @desc    Login user with Firebase
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Sign in with Firebase Auth
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const firebaseUser = userCredential.user;

    // Get user from our database
    const user = await User.findById(firebaseUser.uid);
    if (!user || !user.isActive) {
      return next(new ErrorResponse('User not found or account deactivated', 401));
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate custom token for client
    const customToken = await auth.createCustomToken(firebaseUser.uid);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token: customToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      return next(new ErrorResponse('Invalid credentials', 401));
    }
    if (error.code === 'auth/user-disabled') {
      return next(new ErrorResponse('Account has been disabled', 401));
    }
    return next(new ErrorResponse('Login failed', 500));
  }
}));

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, asyncHandler(async (req, res, next) => {
  // Firebase handles logout on the client side
  // We can revoke refresh tokens here if needed
  
  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
}));

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    success: true,
    data: user
  });
}));

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
router.put('/updatedetails', protect, [
  body('firstName').optional().isLength({ min: 1, max: 50 }).trim(),
  body('lastName').optional().isLength({ min: 1, max: 50 }).trim(),
  body('username').optional().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  body('email').optional().isEmail().normalizeEmail()
], asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    username: req.body.username,
    email: req.body.email
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  // Check if username or email already exists
  if (fieldsToUpdate.username) {
    const existingUsername = await User.findByUsername(fieldsToUpdate.username);
    if (existingUsername && existingUsername.id !== req.user.id) {
      return next(new ErrorResponse('Username already taken', 400));
    }
  }

  if (fieldsToUpdate.email) {
    const existingEmail = await User.findByEmail(fieldsToUpdate.email);
    if (existingEmail && existingEmail.id !== req.user.id) {
      return next(new ErrorResponse('Email already registered', 400));
    }
  }

  const user = await User.findById(req.user.id);
  await user.update(fieldsToUpdate);

  res.status(200).json({
    success: true,
    data: user
  });
}));

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
router.put('/updatepassword', protect, [
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
], asyncHandler(async (req, res, next) => {
  const { newPassword } = req.body;

  try {
    // Update password in Firebase Auth
    await auth.updateUser(req.user.id, {
      password: newPassword
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    if (error.code === 'auth/weak-password') {
      return next(new ErrorResponse('Password is too weak', 400));
    }
    return next(new ErrorResponse('Password update failed', 500));
  }
}));

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
router.post('/forgotpassword', [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail()
], asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  try {
    // Send password reset email using Firebase Auth
    await auth.generatePasswordResetLink(email);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return next(new ErrorResponse('There is no user with that email', 404));
    }
    return next(new ErrorResponse('Password reset email could not be sent', 500));
  }
}));

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Private
router.post('/verify-email', protect, asyncHandler(async (req, res, next) => {
  try {
    // Send email verification using Firebase Auth
    await auth.generateEmailVerificationLink(req.user.email);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    return next(new ErrorResponse('Verification email could not be sent', 500));
  }
}));

// @desc    Delete user account
// @route   DELETE /api/auth/delete-account
// @access  Private
router.delete('/delete-account', protect, asyncHandler(async (req, res, next) => {
  try {
    // Delete user from Firebase Auth
    await auth.deleteUser(req.user.id);

    // Soft delete user from our database
    const user = await User.findById(req.user.id);
    await user.delete();

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    return next(new ErrorResponse('Account deletion failed', 500));
  }
}));

module.exports = router;