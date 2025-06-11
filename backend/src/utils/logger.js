/**
 * Logging Utility
 * 
 * Centralized logging configuration using Winston for the MetroPower Dashboard.
 * Provides structured logging with different levels and formats.
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists (skip in serverless environment)
const logsDir = path.join(__dirname, '../../logs');
const isServerless = process.env.VERCEL || process.env.DISABLE_FILE_LOGGING;

if (!isServerless && !fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (error) {
    console.warn('Could not create logs directory:', error.message);
  }
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'metropower-dashboard-api',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  exitOnError: false,
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

// Add production-specific transports
if (process.env.NODE_ENV === 'production') {
  // You can add additional transports here for production
  // such as external logging services (e.g., CloudWatch, Splunk, etc.)
}

/**
 * Create a child logger with additional metadata
 * @param {Object} meta - Additional metadata to include in logs
 * @returns {Object} Child logger instance
 */
const createChildLogger = (meta) => {
  return logger.child(meta);
};

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
 * Log API requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} duration - Request processing time in ms
 */
const logRequest = (req, res, duration) => {
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
 * Log authentication events
 * @param {string} event - Authentication event type
 * @param {Object} data - Event data
 */
const logAuth = (event, data) => {
  logger.info('Authentication Event', {
    event,
    ...data,
    type: 'authentication'
  });
};

/**
 * Log business events (assignments, exports, etc.)
 * @param {string} event - Business event type
 * @param {Object} data - Event data
 */
const logBusiness = (event, data) => {
  logger.info('Business Event', {
    event,
    ...data,
    type: 'business'
  });
};

/**
 * Log security events
 * @param {string} event - Security event type
 * @param {Object} data - Event data
 */
const logSecurity = (event, data) => {
  logger.warn('Security Event', {
    event,
    ...data,
    type: 'security'
  });
};

/**
 * Log performance metrics
 * @param {string} metric - Metric name
 * @param {number} value - Metric value
 * @param {Object} metadata - Additional metadata
 */
const logMetric = (metric, value, metadata = {}) => {
  logger.info('Performance Metric', {
    metric,
    value,
    ...metadata,
    type: 'performance'
  });
};

// Export logger and utility functions
module.exports = logger;
module.exports.createChildLogger = createChildLogger;
module.exports.logQuery = logQuery;
module.exports.logRequest = logRequest;
module.exports.logAuth = logAuth;
module.exports.logBusiness = logBusiness;
module.exports.logSecurity = logSecurity;
module.exports.logMetric = logMetric;
