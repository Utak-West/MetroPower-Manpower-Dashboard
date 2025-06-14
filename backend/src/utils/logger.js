/**
 * Logging Utility
 * 
 * Provides structured logging for the MetroPower Dashboard application.
 * Uses Winston for flexible logging with multiple transports.
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Check if running in serverless environment
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.DISABLE_FILE_LOGGING === 'true';

// Create logs directory if it doesn't exist (only for non-serverless)
const logsDir = path.join(process.cwd(), 'logs');
if (!isServerless) {
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  } catch (error) {
    console.warn('Could not create logs directory:', error.message);
  }
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}] ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'metropower-dashboard',
    environment: process.env.NODE_ENV || 'development'
  },
  
  // File transports (disabled in serverless)
  transports: isServerless ? [] : [
    // File transport for all logs (disabled in serverless)
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // File transport for all logs (disabled in serverless)
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
  
  // Handle exceptions and rejections (disabled in serverless)
  exceptionHandlers: isServerless ? [] : [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 3
    })
  ],

  rejectionHandlers: isServerless ? [] : [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 3
    })
  ]
});

// Add console transport for non-production environments or serverless
if (process.env.NODE_ENV !== 'production' || isServerless) {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: isServerless ? 'error' : 'debug'
  }));
}

// Add production console transport with limited output
if (process.env.NODE_ENV === 'production' && !isServerless) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.simple()
    ),
    level: 'warn'
  }));
}

/**
 * Log database queries (for debugging)
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @param {number} duration - Query execution time in ms
 */
const logQuery = (query, params = [], duration = 0) => {
  if (process.env.LOG_LEVEL === 'debug') {
    logger.debug('Database Query', {
      query: query.replace(/\s+/g, ' ').trim(),
      params,
      duration: `${duration}ms`,
      type: 'database'
    });
  }
};

/**
 * Log authentication events
 * @param {string} event - Event type
 * @param {Object} details - Event details
 */
const logAuth = (event, details) => {
  logger.info('Authentication Event', {
    event,
    ...details,
    type: 'authentication'
  });
};

/**
 * Log security events
 * @param {string} event - Event type
 * @param {Object} details - Event details
 */
const logSecurity = (event, details) => {
  logger.warn('Security Event', {
    event,
    ...details,
    type: 'security'
  });
};

/**
 * Log API requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} duration - Request duration in ms
 */
const logRequest = (req, res, duration) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    type: 'request'
  };

  if (res.statusCode >= 500) {
    logger.error('HTTP Request', logData);
  } else if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

/**
 * Log business events
 * @param {string} event - Event type
 * @param {Object} details - Event details
 */
const logBusiness = (event, details) => {
  logger.info('Business Event', {
    event,
    ...details,
    type: 'business'
  });
};

/**
 * Create a child logger with additional context
 * @param {Object} context - Additional context to include in all logs
 * @returns {Object} Child logger
 */
const createChildLogger = (context) => {
  return logger.child(context);
};

// Export logger and utility functions
module.exports = logger;
module.exports.logQuery = logQuery;
module.exports.logAuth = logAuth;
module.exports.logSecurity = logSecurity;
module.exports.logRequest = logRequest;
module.exports.logBusiness = logBusiness;
module.exports.createChildLogger = createChildLogger;
