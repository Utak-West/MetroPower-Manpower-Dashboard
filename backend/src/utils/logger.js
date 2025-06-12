/**
 * Logger Utility
 *
 * Centralized logging configuration for the MetroPower Dashboard
 * with structured logging, file rotation, and security logging.
 *
 * Copyright 2025 The HigherSelf Network
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const config = require('../config/app');

// Ensure logs directory exists
const logsDir = path.dirname(config.logging.file);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for structured logging
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }

    return logMessage;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} ${level}: ${message}`;

    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }

    return logMessage;
  })
);

// Create transports array
const transports = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    level: config.logging.level,
    format: process.env.NODE_ENV === 'production' ? customFormat : consoleFormat,
    handleExceptions: true,
    handleRejections: true
  })
);

// File transport (disabled in serverless environments)
if (!config.logging.disableFileLogging && process.env.NODE_ENV !== 'test') {
  // Main log file with rotation
  transports.push(
    new DailyRotateFile({
      filename: config.logging.file.replace('.log', '-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      level: config.logging.level,
      format: customFormat,
      handleExceptions: true,
      handleRejections: true
    })
  );

  // Error log file
  transports.push(
    new DailyRotateFile({
      filename: config.logging.file.replace('.log', '-error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      level: 'error',
      format: customFormat
    })
  );

  // Security log file
  transports.push(
    new DailyRotateFile({
      filename: config.logging.file.replace('.log', '-security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      level: 'warn',
      format: customFormat
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: customFormat,
  defaultMeta: {
    service: 'metropower-dashboard',
    environment: config.app.environment,
    version: config.app.version
  },
  transports,
  exitOnError: false
});

// Add request correlation ID support
logger.addRequestId = (req, res, next) => {
  req.id = req.id || Math.random().toString(36).substr(2, 9);
  logger.defaultMeta.requestId = req.id;
  next();
};

/**
 * Log security events
 * @param {string} event - Security event type
 * @param {Object} data - Additional data
 */
logger.logSecurity = (event, data = {}) => {
  logger.warn('Security Event', {
    event,
    timestamp: new Date().toISOString(),
    ...data
  });
};

/**
 * Log API requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} duration - Request processing time in ms
 */
logger.logRequest = (req, res, duration) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    type: 'api-request'
  };

  // Add user info if available
  if (req.user) {
    logData.userId = req.user.user_id;
    logData.userRole = req.user.role;
  }

  // Add request ID if available
  if (req.id) {
    logData.requestId = req.id;
  }

  // Log based on status code
  if (res.statusCode >= 500) {
    logger.error('API Request Error', logData);
  } else if (res.statusCode >= 400) {
    logger.warn('API Request Warning', logData);
  } else {
    logger.info('API Request', logData);
  }
};

/**
 * Log database operations
 * @param {string} operation - Database operation type
 * @param {string} table - Table name
 * @param {Object} data - Additional data
 */
logger.logDatabase = (operation, table, data = {}) => {
  logger.debug('Database Operation', {
    operation,
    table,
    timestamp: new Date().toISOString(),
    ...data
  });
};

/**
 * Log authentication events
 * @param {string} event - Auth event type
 * @param {Object} data - Additional data
 */
logger.logAuth = (event, data = {}) => {
  logger.info('Authentication Event', {
    event,
    timestamp: new Date().toISOString(),
    ...data
  });
};

/**
 * Log business events
 * @param {string} event - Business event type
 * @param {Object} data - Additional data
 */
logger.logBusiness = (event, data = {}) => {
  logger.info('Business Event', {
    event,
    timestamp: new Date().toISOString(),
    ...data
  });
};

/**
 * Log performance metrics
 * @param {string} metric - Metric name
 * @param {number} value - Metric value
 * @param {Object} data - Additional data
 */
logger.logMetric = (metric, value, data = {}) => {
  logger.info('Performance Metric', {
    metric,
    value,
    timestamp: new Date().toISOString(),
    ...data
  });
};

/**
 * Create child logger with additional context
 * @param {Object} context - Additional context
 * @returns {Object} Child logger
 */
logger.child = (context) => {
  return logger.child(context);
};

/**
 * Graceful shutdown
 */
logger.gracefulShutdown = () => {
  return new Promise((resolve) => {
    logger.info('Shutting down logger...');
    logger.end(() => {
      resolve();
    });
  });
};

// Handle logger errors
logger.on('error', (error) => {
  console.error('Logger error:', error);
});

// Log startup message
logger.info('Logger initialized', {
  level: config.logging.level,
  environment: config.app.environment,
  fileLogging: !config.logging.disableFileLogging
});

module.exports = logger;
