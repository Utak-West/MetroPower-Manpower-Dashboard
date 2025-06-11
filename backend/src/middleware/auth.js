/**
 * Authentication Middleware
 * 
 * Handles JWT token verification and user authentication for protected routes
 * in the MetroPower Dashboard API.
 */

const User = require('../models/User');
const logger = require('../utils/logger');

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

      logger.info('Demo mode: Using demo user for authentication');
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
    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};

/**
 * Role-based authorization middleware factory
 * Creates middleware that checks if user has required role
 * @param {Array|string} allowedRoles - Allowed roles
 * @returns {Function} Middleware function
 */
const authorize = (allowedRoles) => {
  // Convert single role to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User must be authenticated to access this resource'
        });
      }

      if (!roles.includes(req.user.role)) {
        logger.logSecurity('unauthorized_access_attempt', {
          userId: req.user.user_id,
          userRole: req.user.role,
          requiredRoles: roles,
          endpoint: req.originalUrl,
          method: req.method
        });

        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `Access denied. Required roles: ${roles.join(', ')}`,
          userRole: req.user.role
        });
      }

      next();

    } catch (error) {
      logger.error('Authorization middleware error:', error);
      return res.status(500).json({
        error: 'Authorization error',
        message: 'An error occurred during authorization'
      });
    }
  };
};

/**
 * Admin-only authorization middleware
 */
const requireAdmin = authorize(['Admin']);

/**
 * Manager-level authorization middleware (Admin, Project Manager, Branch Manager)
 */
const requireManager = authorize(['Admin', 'Project Manager', 'Branch Manager']);

/**
 * HR access authorization middleware (Admin, HR, Branch Manager)
 */
const requireHR = authorize(['Admin', 'HR', 'Branch Manager']);

/**
 * Optional authentication middleware
 * Attaches user data if token is provided, but doesn't require authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = await User.verifyAccessToken(token);
      
      if (decoded) {
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
    logger.debug('Optional auth middleware error:', error);
    // Continue without authentication for optional auth
    next();
  }
};

/**
 * Rate limiting middleware for authentication endpoints
 */
const authRateLimit = (req, res, next) => {
  // This would typically use a more sophisticated rate limiting solution
  // For now, we'll rely on the global rate limiter
  next();
};

/**
 * Middleware to check if user can access specific employee data
 * @param {string} paramName - Parameter name containing employee ID
 */
const canAccessEmployee = (paramName = 'employeeId') => {
  return async (req, res, next) => {
    try {
      const employeeId = req.params[paramName];
      const userRole = req.user.role;

      // Admins and managers can access all employee data
      if (['Admin', 'Project Manager', 'Branch Manager', 'HR'].includes(userRole)) {
        return next();
      }

      // View Only users can only view, not modify
      if (userRole === 'View Only' && req.method !== 'GET') {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: 'View Only users cannot modify employee data'
        });
      }

      next();

    } catch (error) {
      logger.error('Employee access check error:', error);
      return res.status(500).json({
        error: 'Authorization error',
        message: 'An error occurred checking employee access permissions'
      });
    }
  };
};

/**
 * Middleware to check if user can access specific project data
 * @param {string} paramName - Parameter name containing project ID
 */
const canAccessProject = (paramName = 'projectId') => {
  return async (req, res, next) => {
    try {
      const projectId = req.params[paramName];
      const userRole = req.user.role;

      // Admins and branch managers can access all projects
      if (['Admin', 'Branch Manager'].includes(userRole)) {
        return next();
      }

      // Project managers can access their own projects
      // This would require checking project ownership in the database
      // For now, allow all project managers
      if (userRole === 'Project Manager') {
        return next();
      }

      // HR can view all projects
      if (userRole === 'HR' && req.method === 'GET') {
        return next();
      }

      // View Only users can only view
      if (userRole === 'View Only' && req.method !== 'GET') {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: 'View Only users cannot modify project data'
        });
      }

      next();

    } catch (error) {
      logger.error('Project access check error:', error);
      return res.status(500).json({
        error: 'Authorization error',
        message: 'An error occurred checking project access permissions'
      });
    }
  };
};

/**
 * Middleware to log API access for audit purposes
 */
const auditLog = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log the request after response is sent
    const duration = Date.now() - req.startTime;
    
    logger.logRequest(req, res, duration);
    
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
