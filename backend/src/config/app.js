/**
 * Application Configuration
 *
 * Centralized configuration management for the MetroPower Dashboard
 * with environment variable validation and default values.
 *
 * Copyright 2025 The HigherSelf Network
 */

const path = require('path');

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

const config = {
  // Application settings
  app: {
    name: process.env.APP_NAME || 'MetroPower Dashboard',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3001,
    host: process.env.HOST || 'localhost',
    company: process.env.COMPANY_NAME || 'MetroPower',
    branch: process.env.BRANCH_NAME || 'Tucker Branch'
  },

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'metropower_dashboard',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    }
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'metropower_jwt_secret_development_only',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'metropower_refresh_secret_development_only',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'MetroPower Dashboard'
  },

  // Email configuration
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASS || '',
    from: {
      email: process.env.FROM_EMAIL || 'noreply@metropower.com',
      name: process.env.FROM_NAME || 'MetroPower Dashboard'
    }
  },

  // File upload configuration
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['xlsx', 'xls', 'csv', 'pdf'],
    tempPath: process.env.TEMP_PATH || './temp'
  },

  // Export configuration
  export: {
    path: process.env.EXPORT_PATH || './exports',
    retentionDays: parseInt(process.env.EXPORT_RETENTION_DAYS) || 30,
    formats: ['xlsx', 'csv', 'pdf']
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    authWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 5
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true
  },

  // WebSocket configuration
  websocket: {
    cors: {
      origin: process.env.WEBSOCKET_CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST']
    }
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    disableFileLogging: process.env.DISABLE_FILE_LOGGING === 'true'
  },

  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'metropower_session_secret',
    cookieMaxAge: parseInt(process.env.COOKIE_MAX_AGE) || 7 * 24 * 60 * 60 * 1000 // 7 days
  },

  // Backup configuration
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 90,
    path: process.env.BACKUP_PATH || './backups'
  },

  // Demo mode configuration
  demo: {
    enabled: process.env.DEMO_MODE_ENABLED === 'true',
    users: [
      {
        user_id: 1,
        username: 'antione.harrell',
        email: 'antione.harrell@metropower.com',
        first_name: 'Antione',
        last_name: 'Harrell',
        role: 'Project Manager',
        is_active: true
      },
      {
        user_id: 2,
        username: 'demo.user',
        email: 'demo@metropower.com',
        first_name: 'Demo',
        last_name: 'User',
        role: 'View Only',
        is_active: true
      }
    ]
  },

  // Feature flags
  features: {
    realTimeUpdates: process.env.FEATURE_REALTIME_UPDATES !== 'false',
    emailNotifications: process.env.FEATURE_EMAIL_NOTIFICATIONS !== 'false',
    fileExports: process.env.FEATURE_FILE_EXPORTS !== 'false',
    userManagement: process.env.FEATURE_USER_MANAGEMENT !== 'false',
    auditLogging: process.env.FEATURE_AUDIT_LOGGING !== 'false'
  },

  // External integrations
  integrations: {
    adp: {
      enabled: process.env.ADP_INTEGRATION_ENABLED === 'true',
      apiUrl: process.env.ADP_API_URL || '',
      clientId: process.env.ADP_CLIENT_ID || '',
      clientSecret: process.env.ADP_CLIENT_SECRET || ''
    },
    ifsArena: {
      enabled: process.env.IFS_ARENA_INTEGRATION_ENABLED === 'true',
      apiUrl: process.env.IFS_ARENA_API_URL || '',
      username: process.env.IFS_ARENA_USERNAME || '',
      password: process.env.IFS_ARENA_PASSWORD || ''
    }
  },

  // Performance settings
  performance: {
    compressionEnabled: process.env.COMPRESSION_ENABLED !== 'false',
    cacheEnabled: process.env.CACHE_ENABLED !== 'false',
    cacheTtl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000 // 30 seconds
  }
};

// Validate configuration
const validateConfig = () => {
  const errors = [];

  // Validate JWT secrets in production
  if (config.app.environment === 'production') {
    if (config.jwt.secret === 'metropower_jwt_secret_development_only') {
      errors.push('JWT_SECRET must be set to a secure value in production');
    }
    if (config.jwt.refreshSecret === 'metropower_refresh_secret_development_only') {
      errors.push('JWT_REFRESH_SECRET must be set to a secure value in production');
    }
  }

  // Validate database configuration
  if (!config.database.host) {
    errors.push('DB_HOST is required');
  }
  if (!config.database.name) {
    errors.push('DB_NAME is required');
  }
  if (!config.database.user) {
    errors.push('DB_USER is required');
  }

  if (errors.length > 0) {
    console.error('Configuration validation errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    if (config.app.environment === 'production') {
      process.exit(1);
    }
  }
};

// Validate configuration on load
validateConfig();

module.exports = config;
