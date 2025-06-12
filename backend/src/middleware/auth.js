/**
 * Authentication Middleware
 *
 * Handles JWT token verification and user authentication for protected routes
 * in the MetroPower Dashboard API with comprehensive error handling.
 *
 * Copyright 2025 The HigherSelf Network
 */

const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const logger = require('../utils/logger');
const config = require('../config/app');

/**
 * Main authentication middleware
 * Verifies JWT token and attaches user data to request
 */
const authenticate = async (req, res, next) => {
  try {
    // In demo mode, use demo user
    if (global.isDemoMode) {
      const demoService = require('../services/demoService');
      const demoUser = await demoService.findUserById(1); // Antione Harrell

      req.user = {
        user_id: demoUser.user_id,
        username: demoUser.username,
        email: demoUser.email,
        role: demoUser.role
      };

      logger.debug('Demo mode: Using demo user for authentication');
      return next();
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

    // Get fresh user data to ensure account is still active
    const user = await User.findById(decoded.user_id);

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        error: 'Account inactive',
        message: 'User account has been deactivated'
      });
    }

    // Attach user data to request
    req.user = {
      user_id: decoded.user_id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Unable to authenticate request'
    });
  }
};

/**
 * Authorization middleware factory
 * Creates middleware to check if user has required role
 */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      logger.warn('Authorization failed', {
        userId: req.user.user_id,
        userRole,
        requiredRoles: allowedRoles
      });

      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

/**
 * Require admin role
 */
const requireAdmin = authorize(['Admin', 'Super Admin']);

/**
 * Require manager role or higher
 */
const requireManager = authorize(['Project Manager', 'Admin', 'Super Admin']);

/**
 * Require HR role or higher
 */
const requireHR = authorize(['HR', 'Project Manager', 'Admin', 'Super Admin']);

/**
 * Optional authentication middleware
 * Attaches user data if token is provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    // In demo mode, always attach demo user
    if (global.isDemoMode) {
      const demoService = require('../services/demoService');
      const demoUser = await demoService.findUserById(1);

      req.user = {
        user_id: demoUser.user_id,
        username: demoUser.username,
        email: demoUser.email,
        role: demoUser.role
      };

      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token provided, continue without user
    }

    const token = authHeader.substring(7);
    const decoded = await User.verifyAccessToken(token);

    if (decoded) {
      const user = await User.findById(decoded.user_id);

      if (user && user.is_active) {
        req.user = {
          user_id: decoded.user_id,
          username: decoded.username,
          email: decoded.email,
          role: decoded.role
        };
      }
    }

    next();
  } catch (error) {
    logger.debug('Optional auth error (continuing without user):', error);
    next(); // Continue without user on error
  }
};

/**
 * Rate limiting for authentication endpoints
 */
const authRateLimit = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMaxRequests,
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP address and user identifier for rate limiting
    const identifier = req.body?.identifier || req.body?.email || 'unknown';
    return `${req.ip}-${identifier}`;
  }
});

/**
 * Resource access control middleware
 * Checks if user can access specific employee data
 */
const canAccessEmployee = (req, res, next) => {
  const userRole = req.user?.role;
  const targetEmployeeId = req.params.id || req.body.employee_id;

  // Admins and managers can access all employee data
  if (['Admin', 'Super Admin', 'Project Manager', 'HR'].includes(userRole)) {
    return next();
  }

  // Regular users can only access their own data
  if (req.user?.user_id === parseInt(targetEmployeeId)) {
    return next();
  }

  return res.status(403).json({
    error: 'Access denied',
    message: 'You can only access your own employee data'
  });
};

/**
 * Project access control middleware
 * Checks if user can access specific project data
 */
const canAccessProject = (req, res, next) => {
  const userRole = req.user?.role;

  // Admins and managers can access all project data
  if (['Admin', 'Super Admin', 'Project Manager'].includes(userRole)) {
    return next();
  }

  // For now, allow view-only access to projects for all authenticated users
  // In a full implementation, you might check project assignments
  if (['View Only', 'HR'].includes(userRole)) {
    // Only allow GET requests for view-only users
    if (req.method !== 'GET') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to modify project data'
      });
    }
  }

  next();
};

/**
 * Middleware to log API access for audit purposes
 */
const auditLog = (req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    // Log the request after response is sent
    const duration = Date.now() - req.startTime;

    logger.info('API Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.user_id,
      userRole: req.user?.role
    });

    // Call original send method
    originalSend.call(this, data);
  };

  // Record start time
  req.startTime = Date.now();

  next();
};

module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  requireManager,
  requireHR,
  optionalAuth,
  authRateLimit,
  canAccessEmployee,
  canAccessProject,
  auditLog
};
