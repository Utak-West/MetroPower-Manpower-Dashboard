/**
 * Error Handling Middleware
 *
 * Comprehensive error handling for the MetroPower Dashboard API
 * with proper logging, sanitization, and user-friendly responses.
 *
 * Copyright 2025 The HigherSelf Network
 */

const logger = require('../utils/logger');

/**
 * Custom error classes
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

/**
 * Async handler wrapper to catch async errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle specific database errors
 */
const handleDatabaseError = (err) => {
  let error;

  // PostgreSQL error codes
  switch (err.code) {
    case '23505': // Unique violation
      error = new ConflictError('Resource already exists');
      break;
    case '23503': // Foreign key violation
      error = new ValidationError('Referenced resource does not exist');
      break;
    case '23502': // Not null violation
      error = new ValidationError('Required field is missing');
      break;
    case '23514': // Check violation
      error = new ValidationError('Data validation failed');
      break;
    case '42P01': // Undefined table
      error = new AppError('Database table not found', 500, 'DATABASE_ERROR');
      break;
    case '42703': // Undefined column
      error = new AppError('Database column not found', 500, 'DATABASE_ERROR');
      break;
    case '28P01': // Invalid password
      error = new AppError('Database authentication failed', 500, 'DATABASE_ERROR');
      break;
    case '3D000': // Invalid database name
      error = new AppError('Database not found', 500, 'DATABASE_ERROR');
      break;
    case '08006': // Connection failure
      error = new AppError('Database connection failed', 500, 'DATABASE_ERROR');
      break;
    default:
      error = new AppError('Database operation failed', 500, 'DATABASE_ERROR');
  }

  error.originalError = err;
  return error;
};

/**
 * Handle JWT errors
 */
const handleJWTError = (err) => {
  let error;

  switch (err.name) {
    case 'JsonWebTokenError':
      error = new AuthenticationError('Invalid authentication token');
      break;
    case 'TokenExpiredError':
      error = new AuthenticationError('Authentication token has expired');
      break;
    case 'NotBeforeError':
      error = new AuthenticationError('Authentication token not active yet');
      break;
    default:
      error = new AuthenticationError('Authentication token error');
  }

  error.originalError = err;
  return error;
};

/**
 * Handle validation errors
 */
const handleValidationError = (err) => {
  let errors = [];

  if (err.isJoi) {
    // Joi validation errors
    errors = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
  } else if (err.array && typeof err.array === 'function') {
    // Express-validator errors
    errors = err.array().map(error => ({
      field: error.param || error.path,
      message: error.msg,
      value: error.value
    }));
  } else if (err.errors) {
    // Mongoose-style validation errors
    errors = Object.keys(err.errors).map(key => ({
      field: key,
      message: err.errors[key].message,
      value: err.errors[key].value
    }));
  }

  const error = new ValidationError('Validation failed', errors);
  error.originalError = err;
  return error;
};

/**
 * Main error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log the original error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.user_id,
    timestamp: new Date().toISOString()
  });

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

  // Prepare error response
  const errorResponse = {
    error: error.code || 'INTERNAL_ERROR',
    message: error.message,
    timestamp: error.timestamp || new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add request ID if available
  if (req.id) {
    errorResponse.requestId = req.id;
  }

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
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`);
  next(error);
};

/**
 * Handle uncaught exceptions in async routes
 */
const handleAsyncErrors = (app) => {
  app.use((err, req, res, next) => {
    if (err instanceof Error) {
      return errorHandler(err, req, res, next);
    }
    next();
  });
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  asyncHandler,
  errorHandler,
  notFoundHandler,
  handleAsyncErrors
};
