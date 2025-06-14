/**
 * Authentication Routes
 * 
 * Handles user authentication, login, logout, and token management
 * for the MetroPower Dashboard application.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authRateLimit } = require('../middleware/auth');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT tokens
 */
router.post('/login', 
  authRateLimit,
  [
    body('identifier')
      .notEmpty()
      .withMessage('Email or username is required')
      .trim(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }

    const { identifier, password } = req.body;

    // Attempt authentication
    const authResult = await User.authenticate(identifier, password);

    if (!authResult) {
      logger.warn('Login attempt failed', {
        identifier,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid credentials'
      });
    }

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', authResult.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    logger.info('User logged in successfully', {
      userId: authResult.user.user_id,
      username: authResult.user.username,
      email: authResult.user.email,
      role: authResult.user.role,
      ip: req.ip
    });

    // Return user data and access token
    res.json({
      success: true,
      message: 'Login successful',
      user: authResult.user,
      accessToken: authResult.accessToken,
      expiresIn: authResult.expiresIn
    });
  })
);

/**
 * POST /api/auth/logout
 * Logout user and clear refresh token
 */
router.post('/logout', (req, res) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken');
  
  logger.info('User logged out', {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', 
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        message: 'No refresh token provided'
      });
    }

    try {
      const authResult = await User.refreshToken(refreshToken);

      // Set new refresh token as httpOnly cookie
      res.cookie('refreshToken', authResult.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      logger.info('Token refreshed successfully', {
        userId: authResult.user.user_id,
        username: authResult.user.username,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        user: authResult.user,
        accessToken: authResult.accessToken,
        expiresIn: authResult.expiresIn
      });

    } catch (error) {
      // Clear invalid refresh token
      res.clearCookie('refreshToken');
      
      logger.warn('Token refresh failed', {
        error: error.message,
        ip: req.ip
      });

      res.status(401).json({
        error: 'Token refresh failed',
        message: error.message
      });
    }
  })
);

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', 
  require('../middleware/auth').authenticate,
  asyncHandler(async (req, res) => {
    // User is attached to request by auth middleware
    const user = await User.getById(req.user.user_id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account no longer exists'
      });
    }

    res.json({
      success: true,
      user: user
    });
  })
);

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password',
  require('../middleware/auth').authenticate,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  ],
  asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }

    const { currentPassword, newPassword } = req.body;

    await User.changePassword(req.user.user_id, currentPassword, newPassword);

    logger.info('Password changed successfully', {
      userId: req.user.user_id,
      username: req.user.username,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  })
);

/**
 * GET /api/auth/status
 * Check authentication status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    authenticated: false,
    message: 'Authentication status endpoint'
  });
});

module.exports = router;
