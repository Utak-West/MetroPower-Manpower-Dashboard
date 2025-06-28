/**
 * Authentication Routes
 *
 * Handles user authentication, registration, and token management
 * for the MetroPower Dashboard API with comprehensive error handling.
 *
 * Copyright 2025 The HigherSelf Network
 */

const express = require('express')
const { body, validationResult } = require('express-validator')
const User = require('../models/User')
const { asyncHandler, ValidationError } = require('../middleware/errorHandler')
const { authRateLimit } = require('../middleware/auth')
const logger = require('../utils/logger')

const router = express.Router()

// No rate limiting for simplicity

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
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    logger.warn('Login validation failed', { errors: errors.array() })
    throw new ValidationError('Invalid input data', errors.array())
  }

  const { identifier, password } = req.body

  try {
    // Authenticate user
    const authResult = await User.authenticate(identifier, password)

    if (!authResult) {
      logger.warn('Authentication failed', { identifier })
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid credentials or inactive account'
      })
    }

    const { user, tokens } = authResult

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    logger.info('User login successful', {
      userId: user.user_id,
      username: user.username,
      role: user.role
    })

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
    })
  } catch (error) {
    logger.error('Login error:', error)
    res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    })
  }
}))

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear refresh token
 * @access  Private
 */
router.post('/logout', asyncHandler(async (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken')

    // In a full implementation, you might want to blacklist the token
    // For now, we'll just clear the cookie

    logger.info('User logout successful')

    res.json({
      message: 'Logout successful'
    })
  } catch (error) {
    logger.error('Logout error:', error)
    res.status(500).json({
      error: 'Logout error',
      message: 'An error occurred during logout'
    })
  }
}))

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token and return user data
 * @access  Private
 */
router.get('/verify', asyncHandler(async (req, res) => {
  try {

    // Get token from Authorization header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid authorization token'
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token
    const decoded = await User.verifyAccessToken(token)

    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or expired'
      })
    }

    // Get fresh user data
    const user = await User.findById(decoded.user_id)

    if (!user || !user.is_active) {
      return res.status(401).json({
        error: 'User not found',
        message: 'User account not found or inactive'
      })
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
    })
  } catch (error) {
    logger.error('Token verification error:', error)
    res.status(401).json({
      error: 'Token verification failed',
      message: 'Unable to verify authentication token'
    })
  }
}))

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  try {

    const refreshToken = req.cookies.refreshToken

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        message: 'No refresh token provided'
      })
    }

    // Verify refresh token and get new access token
    const result = await User.refreshAccessToken(refreshToken)

    if (!result) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        message: 'The refresh token is invalid or expired'
      })
    }

    res.json({
      message: 'Token refreshed successfully',
      accessToken: result.accessToken
    })
  } catch (error) {
    logger.error('Token refresh error:', error)
    res.status(401).json({
      error: 'Token refresh failed',
      message: 'Unable to refresh authentication token'
    })
  }
}))

/**
 * @route   GET /api/auth/demo-bypass
 * @desc    Demo bypass login - automatically login as admin for development
 * @access  Public
 */
router.get('/demo-bypass', asyncHandler(async (req, res) => {
  try {
    if (!global.isDemoMode) {
      return res.status(403).json({
        error: 'Demo bypass disabled',
        message: 'Demo bypass is only available in demo mode'
      })
    }

    // Find the admin user for demo bypass
    const demoService = require('../services/demoService')

    // Debug: Try to find any user first
    logger.info('Attempting to find demo user...')
    let adminUser = await demoService.findUserByIdentifier('antione.harrell@metropower.com')

    if (!adminUser) {
      // Try the admin user as fallback
      logger.info('Manager user not found, trying admin user...')
      adminUser = await demoService.findUserByIdentifier('admin@metropower.com')
    }

    if (!adminUser) {
      logger.error('No demo users found')
      return res.status(500).json({
        error: 'Demo setup error',
        message: 'Demo admin user not found'
      })
    }

    // Generate tokens for the admin user
    const accessToken = await User.generateAccessToken({
      user_id: adminUser.user_id,
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role
    })

    const refreshToken = await User.generateRefreshToken({
      user_id: adminUser.user_id,
      username: adminUser.username
    })

    // Update last login
    await demoService.updateUserLastLogin(adminUser.user_id)

    logger.info('Demo bypass login successful', {
      userId: adminUser.user_id,
      email: adminUser.email
    })

    res.json({
      success: true,
      message: 'Demo login successful',
      accessToken,
      refreshToken,
      user: {
        user_id: adminUser.user_id,
        username: adminUser.username,
        email: adminUser.email,
        first_name: adminUser.first_name,
        last_name: adminUser.last_name,
        role: adminUser.role,
        is_active: adminUser.is_active,
        last_login: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('Demo bypass error:', error)
    res.status(500).json({
      error: 'Demo bypass failed',
      message: 'An error occurred during demo bypass login'
    })
  }
}))

module.exports = router
