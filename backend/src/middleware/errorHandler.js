/**
 * Error Handling Middleware
 * 
 * Provides centralized error handling for the MetroPower Dashboard API.
 * Includes custom error classes and error response formatting.
 */

const logger = require('../utils/logger');

/**
 * Custom error classes
 */
class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

class ForbiddenError extends Error {
  constructor(message = 'Access forbidden') {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}

class ConflictError extends Error {
  constructor(message = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

class DatabaseError extends Error {
  constructor(message = 'Database operation failed') {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
  }
}

/**
 * Async handler wrapper to catch async errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  const errorInfo = {
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  };

  // Log based on error severity
  if (err.statusCode >= 500) {
    logger.error('Server Error:', errorInfo);
  } else if (err.statusCode >= 400) {
    logger.warn('Client Error:', errorInfo);
  } else {
    logger.info('Request Error:', errorInfo);
  }

  // Default error response
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // Handle specific error types
  switch (err.name) {
    case 'ValidationError':
      statusCode = 400;
      message = 'Validation Error';
      details = err.details || err.errors;
      break;

    case 'CastError':
      statusCode = 400;
      message = 'Invalid ID format';
      break;

    case 'JsonWebTokenError':
      statusCode = 401;
      message = 'Invalid token';
      break;

    case 'TokenExpiredError':
      statusCode = 401;
      message = 'Token expired';
      break;

    case 'MongoError':
    case 'DatabaseError':
      if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate field value';
        const field = Object.keys(err.keyValue)[0];
        details = [`${field} already exists`];
      } else {
        statusCode = 500;
        message = 'Database error';
      }
      break;

    case 'MulterError':
      statusCode = 400;
      if (err.code === 'LIMIT_FILE_SIZE') {
        message = 'File too large';
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        message = 'Too many files';
      } else {
        message = 'File upload error';
      }
      break;

    default:
      if (statusCode === 500) {
        message = 'Internal Server Error';
        // Don't expose internal error details in production
        if (process.env.NODE_ENV === 'production') {
          details = null;
        }
      }
  }

  // Error response format
  const errorResponse = {
    error: err.name || 'Error',
    message: message,
    statusCode: statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  };

  // Add details if available and not in production
  if (details && (process.env.NODE_ENV !== 'production' || statusCode < 500)) {
    errorResponse.details = details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Handle database connection errors
 * @param {Error} err - Database error
 * @returns {Error} Formatted error
 */
const handleDatabaseError = (err) => {
  if (err.code === 'ECONNREFUSED') {
    return new DatabaseError('Database connection refused');
  } else if (err.code === 'ENOTFOUND') {
    return new DatabaseError('Database host not found');
  } else if (err.code === '28P01') {
    return new DatabaseError('Database authentication failed');
  } else if (err.code === '3D000') {
    return new DatabaseError('Database does not exist');
  } else if (err.code === '23505') {
    return new ConflictError('Duplicate entry');
  } else if (err.code === '23503') {
    return new ValidationError('Foreign key constraint violation');
  } else if (err.code === '23502') {
    return new ValidationError('Required field missing');
  }
  
  return new DatabaseError(err.message);
};

/**
 * Validate required environment variables
 * @param {Array} requiredVars - Array of required environment variable names
 * @throws {Error} If required variables are missing
 */
const validateEnvironment = (requiredVars) => {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

module.exports = {
  // Error classes
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  DatabaseError,
  
  // Middleware functions
  asyncHandler,
  errorHandler,
  notFoundHandler,
  
  // Utility functions
  handleDatabaseError,
  validateEnvironment
};
