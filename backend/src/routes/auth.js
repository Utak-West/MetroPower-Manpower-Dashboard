/**
 * Authentication Routes
 * 
 * Handles user authentication, registration, and token management
 * for the MetroPower Dashboard API.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const { authRateLimit } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authRateLimit);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT tokens
 * @access  Public
 */
router.post('/login', [
  body('identifier')
    .notEmpty()
    .withMessage('Email or username is required')
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1 })
    .withMessage('Password cannot be empty')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { identifier, password } = req.body;

  // Authenticate user
  const authResult = await User.authenticate(identifier, password);

  if (!authResult) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid credentials or inactive account'
    });
  }

  const { user, tokens } = authResult;

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({
    message: 'Login successful',
    user: {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      last_login: user.last_login
    },
    accessToken: tokens.accessToken
  });
}));

/**
 * @route   POST /api/auth/register
 * @desc    Register new user (Admin only)
 * @access  Private (Admin)
 */
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('first_name')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters')
    .trim(),
  body('last_name')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters')
    .trim(),
  body('role')
    .optional()
    .isIn(['Admin', 'Project Manager', 'Branch Manager', 'HR', 'View Only'])
    .withMessage('Invalid role specified')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const userData = req.body;
  
  // For now, allow registration without authentication
  // In production, this should require admin authentication
  const newUser = await User.create(userData);

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      user_id: newUser.user_id,
      username: newUser.username,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      role: newUser.role,
      is_active: newUser.is_active,
      created_at: newUser.created_at
    }
  });
}));

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      error: 'Refresh token required',
      message: 'Please provide a valid refresh token'
    });
  }

  const tokens = await User.refreshToken(refreshToken);

  if (!tokens) {
    // Clear invalid refresh token cookie
    res.clearCookie('refreshToken');
    
    return res.status(401).json({
      error: 'Invalid refresh token',
      message: 'Please login again'
    });
  }

  // Set new refresh token as httpOnly cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({
    message: 'Token refreshed successfully',
    accessToken: tokens.accessToken
  });
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear refresh token
 * @access  Public
 */
router.post('/logout', (req, res) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  // In a more sophisticated implementation, you might want to:
  // 1. Blacklist the access token
  // 2. Remove refresh token from database
  // 3. Log the logout event

  res.json({
    message: 'Logout successful'
  });
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset token
 * @access  Public
 */
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { email } = req.body;

  const resetToken = await User.generatePasswordResetToken(email);

  // Always return success to prevent email enumeration
  // In a real implementation, you would send an email with the reset token
  res.json({
    message: 'If an account with that email exists, a password reset link has been sent',
    // In development, include the token for testing
    ...(process.env.NODE_ENV === 'development' && resetToken && { resetToken })
  });
}));

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using reset token
 * @access  Public
 */
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { token, password } = req.body;

  const success = await User.resetPassword(token, password);

  if (!success) {
    return res.status(400).json({
      error: 'Invalid or expired token',
      message: 'The password reset token is invalid or has expired'
    });
  }

  res.json({
    message: 'Password reset successful'
  });
}));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', asyncHandler(async (req, res) => {
  // This route would typically require authentication middleware
  // For now, return a placeholder response
  res.json({
    message: 'This endpoint requires authentication middleware',
    note: 'Use the authenticate middleware to protect this route'
  });
}));

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token validity
 * @access  Public
 */
router.get('/verify', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      valid: false,
      message: 'No token provided'
    });
  }

  const token = authHeader.substring(7);
  const decoded = await User.verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({
      valid: false,
      message: 'Invalid or expired token'
    });
  }

  res.json({
    valid: true,
    user: {
      user_id: decoded.user_id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    }
  });
}));

module.exports = router;
