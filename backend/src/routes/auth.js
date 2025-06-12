/**
 * Authentication Routes
 *
 * Handles user authentication, registration, and token management
 * for the MetroPower Dashboard API with comprehensive error handling.
 *
 * Copyright 2025 The HigherSelf Network
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
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post('/login', [
  body('identifier')
    .notEmpty()
    .withMessage('Username or email is required')
    .trim()
    .escape(),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required')
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Login validation failed', { errors: errors.array() });
    throw new ValidationError('Invalid input data', errors.array());
  }

  const { identifier, password } = req.body;

  // Handle demo mode
  if (global.isDemoMode) {
    const demoService = require('../services/demoService');

    try {
      // In demo mode, accept any credentials and return demo user
      const demoUser = await demoService.findUserById(1); // Antione Harrell

      logger.info('Demo mode: Login successful with demo user', {
        identifier,
        userId: demoUser.user_id
      });

      return res.json({
        message: 'Demo login successful',
        user: {
          user_id: demoUser.user_id,
          username: demoUser.username,
          email: demoUser.email,
          first_name: demoUser.first_name,
          last_name: demoUser.last_name,
          role: demoUser.role,
          last_login: new Date().toISOString()
        },
        accessToken: 'demo-token-' + Date.now(), // Simple demo token
        isDemoMode: true
      });
    } catch (error) {
      logger.error('Demo mode login error:', error);
      return res.status(500).json({
        error: 'Demo mode error',
        message: 'Failed to authenticate in demo mode'
      });
    }
  }

  try {
    // Authenticate user
    const authResult = await User.authenticate(identifier, password);

    if (!authResult) {
      logger.warn('Authentication failed', { identifier });
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

    logger.info('User login successful', {
      userId: user.user_id,
      username: user.username,
      role: user.role
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
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear refresh token
 * @access  Private
 */
router.post('/logout', asyncHandler(async (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    // In a full implementation, you might want to blacklist the token
    // For now, we'll just clear the cookie

    logger.info('User logout successful');

    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout error',
      message: 'An error occurred during logout'
    });
  }
}));

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token and return user data
 * @access  Private
 */
router.get('/verify', asyncHandler(async (req, res) => {
  try {
    // Handle demo mode
    if (global.isDemoMode) {
      const demoService = require('../services/demoService');
      const demoUser = await demoService.findUserById(1);

      return res.json({
        message: 'Token verified (demo mode)',
        user: {
          user_id: demoUser.user_id,
          username: demoUser.username,
          email: demoUser.email,
          first_name: demoUser.first_name,
          last_name: demoUser.last_name,
          role: demoUser.role
        },
        isDemoMode: true
      });
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid authorization token'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = await User.verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or expired'
      });
    }

    // Get fresh user data
    const user = await User.findById(decoded.user_id);

    if (!user || !user.is_active) {
      return res.status(401).json({
        error: 'User not found',
        message: 'User account not found or inactive'
      });
    }

    res.json({
      message: 'Token verified',
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Token verification error:', error);
    res.status(401).json({
      error: 'Token verification failed',
      message: 'Unable to verify authentication token'
    });
  }
}));

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  try {
    // Handle demo mode
    if (global.isDemoMode) {
      return res.json({
        message: 'Token refreshed (demo mode)',
        accessToken: 'demo-token-' + Date.now(),
        isDemoMode: true
      });
    }

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        message: 'No refresh token provided'
      });
    }

    // Verify refresh token and get new access token
    const result = await User.refreshAccessToken(refreshToken);

    if (!result) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        message: 'The refresh token is invalid or expired'
      });
    }

    res.json({
      message: 'Token refreshed successfully',
      accessToken: result.accessToken
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Token refresh failed',
      message: 'Unable to refresh authentication token'
    });
  }
}));

module.exports = router;
