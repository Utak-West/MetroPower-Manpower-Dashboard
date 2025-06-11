/**
 * Application Configuration
 * 
 * Central configuration file for the MetroPower Dashboard application.
 * Contains all application-wide settings and constants.
 */

module.exports = {
  // Application Information
  app: {
    name: process.env.APP_NAME || 'MetroPower Manpower Dashboard',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    company: process.env.COMPANY_NAME || 'MetroPower',
    branch: process.env.BRANCH_NAME || 'Tucker Branch'
  },

  // Server Configuration
  server: {
    port: parseInt(process.env.PORT) || 3001,
    host: process.env.HOST || 'localhost'
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'metropower_dashboard',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    pool: {
      min: 2,
      max: 10,
      acquire: 30000,
      idle: 10000
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  // Email Configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    },
    from: {
      email: process.env.FROM_EMAIL || 'noreply@metropower.com',
      name: process.env.FROM_NAME || 'MetroPower Dashboard'
    }
  },

  // File Upload Configuration
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'xlsx,xls,csv,pdf').split(',')
  },

  // Export Configuration
  export: {
    path: process.env.EXPORT_PATH || './exports',
    retentionDays: parseInt(process.env.EXPORT_RETENTION_DAYS) || 30
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log'
  },

  // Employee Status Options
  employeeStatus: {
    ACTIVE: 'Active',
    PTO: 'PTO',
    LEAVE: 'Leave',
    MILITARY: 'Military',
    TERMINATED: 'Terminated'
  },

  // Project Status Options
  projectStatus: {
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    ON_HOLD: 'On Hold',
    PLANNED: 'Planned'
  },

  // User Roles
  userRoles: {
    ADMIN: 'Admin',
    PROJECT_MANAGER: 'Project Manager',
    BRANCH_MANAGER: 'Branch Manager',
    HR: 'HR',
    VIEW_ONLY: 'View Only'
  },

  // Position/Trade Categories
  positions: {
    ELECTRICIAN: {
      name: 'Electrician',
      code: 'EL',
      color: '#28A745'
    },
    FIELD_SUPERVISOR: {
      name: 'Field Supervisor',
      code: 'FS',
      color: '#3B5998'
    },
    APPRENTICE: {
      name: 'Apprentice',
      code: 'AP',
      color: '#F7B731'
    },
    GENERAL_LABORER: {
      name: 'General Laborer',
      code: 'GL',
      color: '#6F42C1'
    },
    TEMP: {
      name: 'Temp',
      code: 'TM',
      color: '#E52822'
    }
  },

  // Notification Types
  notificationTypes: {
    ASSIGNMENT_CHANGE: 'Assignment Change',
    DAILY_SUMMARY: 'Daily Summary',
    EXCEPTION_ALERT: 'Exception Alert'
  },

  // Export Types
  exportTypes: {
    EXCEL: 'Excel',
    CSV: 'CSV',
    MARKDOWN: 'Markdown',
    PDF: 'PDF'
  },

  // Days of the week
  weekDays: [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday'
  ],

  // Business Rules
  businessRules: {
    maxAssignmentsPerDay: 1, // Prevent double-booking
    workWeekDays: 5, // Monday to Friday
    archiveRetentionWeeks: 52, // Keep archives for 1 year
    notificationRetentionDays: 30,
    exportRetentionDays: 30
  },

  // Integration Settings (for future use)
  integrations: {
    adp: {
      apiUrl: process.env.ADP_API_URL || '',
      apiKey: process.env.ADP_API_KEY || ''
    },
    ifsArena: {
      url: process.env.IFS_ARENA_URL || '',
      apiKey: process.env.IFS_ARENA_API_KEY || ''
    }
  },

  // Backup Configuration
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 90
  }
};
