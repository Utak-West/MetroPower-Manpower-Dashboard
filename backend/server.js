/**
 * MetroPower Manpower Dashboard - Main Server
 * 
 * Express.js server setup with middleware, routes, and database initialization.
 * Supports both standalone and serverless deployment.
 */

require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

// Import configuration and utilities
const config = require('./src/config/app');
const logger = require('./src/utils/logger');
const { connectDatabase } = require('./src/config/database');

// Import middleware
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

// Import routes
const authRoutes = require('./src/routes/auth');
const dashboardRoutes = require('./src/routes/dashboard');
const employeeRoutes = require('./src/routes/employees');
const projectRoutes = require('./src/routes/projects');
const assignmentRoutes = require('./src/routes/assignments');
const exportRoutes = require('./src/routes/exports');
const archiveRoutes = require('./src/routes/archives');
const notificationRoutes = require('./src/routes/notifications');

// Create Express application
const app = express();

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: config.app.name,
    version: config.app.version,
    environment: config.app.environment
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/archives', archiveRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve static files in production
if (config.app.environment === 'production') {
  const frontendPath = path.join(__dirname, '..', 'frontend');
  app.use(express.static(frontendPath));
  
  // Serve index.html for all non-API routes (SPA support)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}

// 404 handler for API routes
app.use('/api/*', notFoundHandler);

// Global error handler
app.use(errorHandler);

/**
 * Initialize the application
 * @returns {Promise<void>}
 */
async function initializeApp() {
  try {
    logger.info('Initializing MetroPower Dashboard...');
    
    // Connect to database
    await connectDatabase();
    logger.info('Database connection established');
    
    // Create necessary directories
    const fs = require('fs').promises;
    const directories = [
      config.upload.path,
      config.export.path,
      path.dirname(config.logging.file)
    ];
    
    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        if (error.code !== 'EEXIST') {
          logger.warn(`Failed to create directory ${dir}:`, error.message);
        }
      }
    }
    
    logger.info('Application initialized successfully');
    
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    throw error;
  }
}

/**
 * Start the server (only if not in serverless environment)
 */
async function startServer() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    // Running in serverless environment, don't start server
    return;
  }
  
  try {
    await initializeApp();
    
    const port = config.server.port;
    const host = config.server.host;
    
    app.listen(port, host, () => {
      logger.info(`Server started on ${host}:${port}`);
      logger.info(`Environment: ${config.app.environment}`);
      logger.info(`Company: ${config.app.company}`);
      logger.info(`Branch: ${config.app.branch}`);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

// Export for serverless deployment
module.exports = {
  app,
  initializeApp,
  startServer
};
