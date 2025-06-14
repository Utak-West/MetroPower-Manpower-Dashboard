/**
 * Authentication and Authorization Middleware
 * 
 * Provides JWT token verification, role-based access control,
 * and rate limiting for the MetroPower Dashboard API.
 */

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const config = require('../config/app');
const logger = require('../utils/logger');
const { UnauthorizedError, ForbiddenError } = require('./errorHandler');
const User = require('../models/User');

/**
 * Rate limiting for authentication endpoints
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

/**
 * Verify JWT token and attach user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token required');
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    if (decoded.type !== 'access') {
      throw new UnauthorizedError('Invalid token type');
    }

    // Check if user still exists and is active
    const user = await User.getById(decoded.user_id);
    if (!user || !user.is_active) {
      throw new UnauthorizedError('User account not found or inactive');
    }

    // Attach user to request
    req.user = {
      user_id: decoded.user_id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      ...user
    };

    logger.debug('User authenticated', {
      userId: req.user.user_id,
      username: req.user.username,
      role: req.user.role
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret);
    
    if (decoded.type === 'access') {
      const user = await User.getById(decoded.user_id);
      if (user && user.is_active) {
        req.user = {
          user_id: decoded.user_id,
          username: decoded.username,
          email: decoded.email,
          role: decoded.role,
          ...user
        };
      }
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
    logger.debug('Optional authentication failed:', error.message);
  }
  
  next();
};

/**
 * Require specific role(s)
 * @param {string|Array} roles - Required role(s)
 * @returns {Function} Express middleware function
 */
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Access denied - insufficient role', {
        userId: req.user.user_id,
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Require admin role
 */
const requireAdmin = [authenticate, requireRole('Admin')];

/**
 * Require manager role or higher
 */
const requireManager = [authenticate, requireRole(['Admin', 'Project Manager', 'Branch Manager'])];

/**
 * Require HR role or higher
 */
const requireHR = [authenticate, requireRole(['Admin', 'HR', 'Branch Manager'])];

/**
 * Check if user can access specific employee
 * @param {string} paramName - Parameter name containing employee ID
 * @returns {Function} Express middleware function
 */
const canAccessEmployee = (paramName = 'employeeId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('Authentication required'));
      }

      const employeeId = req.params[paramName];
      
      // Admins and managers can access all employees
      if (['Admin', 'Project Manager', 'Branch Manager', 'HR'].includes(req.user.role)) {
        return next();
      }

      // Users can only access their own employee record
      // This would require linking users to employees
      // For now, allow View Only users to view all employees
      if (req.user.role === 'View Only' && req.method === 'GET') {
        return next();
      }

      next(new ForbiddenError('Cannot access this employee record'));
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user can access specific project
 * @param {string} paramName - Parameter name containing project ID
 * @returns {Function} Express middleware function
 */
const canAccessProject = (paramName = 'projectId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('Authentication required'));
      }

      const projectId = req.params[paramName];
      
      // Admins and branch managers can access all projects
      if (['Admin', 'Branch Manager'].includes(req.user.role)) {
        return next();
      }

      // Project managers can access projects they manage
      if (req.user.role === 'Project Manager') {
        // TODO: Check if user is assigned as project manager
        return next();
      }

      // HR can view all projects
      if (req.user.role === 'HR' && req.method === 'GET') {
        return next();
      }

      // View Only users can view all projects
      if (req.user.role === 'View Only' && req.method === 'GET') {
        return next();
      }

      next(new ForbiddenError('Cannot access this project'));
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user can modify assignments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const canModifyAssignments = (req, res, next) => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  // Only certain roles can modify assignments
  const allowedRoles = ['Admin', 'Project Manager', 'Branch Manager'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return next(new ForbiddenError('Cannot modify assignments'));
  }

  next();
};

/**
 * Log security events
 * @param {string} event - Event type
 * @param {Object} details - Event details
 */
const logSecurityEvent = (event, details) => {
  logger.warn('Security Event', {
    event,
    ...details,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  // Rate limiting
  authRateLimit,
  
  // Authentication middleware
  authenticate,
  optionalAuth,
  
  // Authorization middleware
  requireRole,
  requireAdmin,
  requireManager,
  requireHR,
  
  // Resource access control
  canAccessEmployee,
  canAccessProject,
  canModifyAssignments,
  
  // Utilities
  logSecurityEvent
};
