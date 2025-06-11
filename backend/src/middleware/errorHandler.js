/**
 * Error Handling Middleware
 * 
 * Centralized error handling for the MetroPower Dashboard API.
 * Provides consistent error responses and logging.
 */

const logger = require('../utils/logger');

/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 */
class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

/**
 * Database error class
 */
class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

/**
 * Authentication error class
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization error class
 */
class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Not found error class
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

/**
 * Conflict error class (for duplicate resources, etc.)
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

/**
 * Handle PostgreSQL database errors
 * @param {Error} error - Database error
 * @returns {AppError} Formatted application error
 */
const handleDatabaseError = (error) => {
  logger.error('Database error:', error);

  // PostgreSQL error codes
  switch (error.code) {
    case '23505': // Unique violation
      const match = error.detail?.match(/Key \((.+)\)=\((.+)\) already exists/);
      if (match) {
        const field = match[1];
        const value = match[2];
        return new ConflictError(`${field} '${value}' already exists`);
      }
      return new ConflictError('Duplicate entry detected');

    case '23503': // Foreign key violation
      return new ValidationError('Referenced resource does not exist');

    case '23502': // Not null violation
      const column = error.column;
      return new ValidationError(`${column} is required`);

    case '23514': // Check constraint violation
      return new ValidationError('Data validation failed');

    case '42P01': // Undefined table
      return new DatabaseError('Database table not found');

    case '42703': // Undefined column
      return new DatabaseError('Database column not found');

    case '28P01': // Invalid password
      return new DatabaseError('Database authentication failed');

    case 'ECONNREFUSED':
      return new DatabaseError('Database connection refused');

    case 'ENOTFOUND':
      return new DatabaseError('Database host not found');

    default:
      return new DatabaseError('Database operation failed', error);
  }
};

/**
 * Handle JWT errors
 * @param {Error} error - JWT error
 * @returns {AppError} Formatted application error
 */
const handleJWTError = (error) => {
  switch (error.name) {
    case 'JsonWebTokenError':
      return new AuthenticationError('Invalid token');
    case 'TokenExpiredError':
      return new AuthenticationError('Token expired');
    case 'NotBeforeError':
      return new AuthenticationError('Token not active');
    default:
      return new AuthenticationError('Token verification failed');
  }
};

/**
 * Handle validation errors from Joi or express-validator
 * @param {Error} error - Validation error
 * @returns {AppError} Formatted application error
 */
const handleValidationError = (error) => {
  if (error.isJoi) {
    // Joi validation error
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
    
    return new ValidationError('Validation failed', errors);
  }

  // Express-validator errors
  if (error.array && typeof error.array === 'function') {
    const errors = error.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));
    
    return new ValidationError('Validation failed', errors);
  }

  return new ValidationError(error.message);
};

/**
 * Main error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle different types of errors
  if (err.name === 'CastError') {
    error = new ValidationError('Invalid ID format');
  } else if (err.code && err.code.startsWith('23')) {
    // PostgreSQL errors
    error = handleDatabaseError(err);
  } else if (err.name && err.name.includes('JsonWebToken')) {
    // JWT errors
    error = handleJWTError(err);
  } else if (err.isJoi || (err.array && typeof err.array === 'function')) {
    // Validation errors
    error = handleValidationError(err);
  } else if (!err.isOperational) {
    // Unknown errors - convert to generic error
    error = new AppError('Something went wrong', 500, 'INTERNAL_ERROR');
  }

  // Log error details
  const errorLog = {
    message: error.message,
    statusCode: error.statusCode,
    code: error.code,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  };

  if (req.user) {
    errorLog.userId = req.user.user_id;
    errorLog.userRole = req.user.role;
  }

  if (error.statusCode >= 500) {
    logger.error('Server Error:', errorLog);
  } else if (error.statusCode >= 400) {
    logger.warn('Client Error:', errorLog);
  }

  // Prepare error response
  const errorResponse = {
    error: error.message,
    code: error.code,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString()
  };

  // Add additional error details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
    errorResponse.originalError = error.originalError?.message;
  }

  // Add validation errors if present
  if (error.errors && error.errors.length > 0) {
    errorResponse.validationErrors = error.errors;
  }

  // Send error response
  res.status(error.statusCode || 500).json(errorResponse);
};

/**
 * Handle 404 errors for undefined routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`);
  next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass them to error handler
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError
};
