/**
 * MetroPower Dashboard - Main Server
 *
 * Express.js server with comprehensive error handling, authentication,
 * and real-time capabilities for the MetroPower workforce management system.
 *
 * Copyright 2025 The HigherSelf Network
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Import configurations and utilities
const config = require('./src/config/app');
const logger = require('./src/utils/logger');
const { connectDatabase } = require('./src/config/database');
const { initializeDatabase } = require('./src/utils/runtime-db-init');

// Import middleware
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const { authenticate: authMiddleware, auditLog } = require('./src/middleware/auth');

// Import routes
const authRoutes = require('./src/routes/auth');
const employeeRoutes = require('./src/routes/employees');
const projectRoutes = require('./src/routes/projects');
const positionRoutes = require('./src/routes/positions');
const assignmentRoutes = require('./src/routes/assignments');
const dashboardRoutes = require('./src/routes/dashboard');
const exportRoutes = require('./src/routes/exports');
const archiveRoutes = require('./src/routes/archives');
const notificationRoutes = require('./src/routes/notifications');
const userRoutes = require('./src/routes/users');

// Initialize Express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.WEBSOCKET_CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Audit logging middleware
app.use(auditLog);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: 'connected'
  });
});

// Debug endpoint for local development
app.get('/api/debug', (req, res) => {
  res.json({
    status: 'debug',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    isDemoMode: global.isDemoMode,
    database: global.isDemoMode ? 'in-memory' : 'postgresql',
    jwt: {
      secret_configured: !!process.env.JWT_SECRET,
      refresh_secret_configured: !!process.env.JWT_REFRESH_SECRET
    },
    message: 'Debug endpoint - local development only'
  });
});

// API Documentation
app.get('/api-docs', (req, res) => {
  res.json({
    name: 'MetroPower Dashboard API',
    version: '1.0.0',
    description: 'Workforce management system API',
    endpoints: {
      auth: '/api/auth',
      employees: '/api/employees',
      projects: '/api/projects',
      positions: '/api/positions',
      assignments: '/api/assignments',
      dashboard: '/api/dashboard',
      exports: '/api/exports',
      archives: '/api/archives',
      notifications: '/api/notifications',
      users: '/api/users'
    },
    documentation: 'https://github.com/Utak-West/The-HigherSelf-Network-Server'
  });
});

// Static file serving
app.use('/uploads', express.static('uploads'));
app.use('/exports', express.static('exports'));

// Serve frontend static files
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Serve frontend assets with proper paths
app.use('/css', express.static(path.join(frontendPath, 'css')));
app.use('/js', express.static(path.join(frontendPath, 'js')));
app.use('/assets', express.static(path.join(frontendPath, 'assets')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', authMiddleware, employeeRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/positions', authMiddleware, positionRoutes);
app.use('/api/assignments', authMiddleware, assignmentRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/calendar', authMiddleware, require('./src/routes/calendar'));
app.use('/api/exports', authMiddleware, exportRoutes);
app.use('/api/archives', authMiddleware, archiveRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/users', authMiddleware, userRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join-room', (data) => {
    const { userId, role } = data;
    socket.join(`user-${userId}`);
    socket.join(`role-${role}`);
    logger.info(`User ${userId} joined room with role ${role}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// Serve frontend HTML for all non-API routes (SPA fallback)
app.get('*', (req, res, next) => {
  // Skip API routes and static files
  if (req.path.startsWith('/api/') ||
      req.path.startsWith('/uploads/') ||
      req.path.startsWith('/exports/') ||
      req.path.startsWith('/health') ||
      req.path.startsWith('/socket.io/') ||
      req.path.includes('.')) {
    return next();
  }

  // Serve the main HTML file for frontend routes
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database connection for serverless
const initializeApp = async () => {
  try {
    logger.info('🚀 Initializing MetroPower Dashboard application...');

    // Use runtime database initialization
    const initResult = await initializeDatabase();

    if (initResult.success && initResult.mode === 'database') {
      // Use persistent database
      logger.info('✅ Using persistent database storage');
      global.isDemoMode = false;

      // Initialize persistent data
      const PersistentDataService = require('./src/services/persistentDataService');
      await PersistentDataService.initializePersistentData();

      logger.info(`📊 Database initialized in ${initResult.initTime}ms with ${initResult.tablesCount} tables`);
    } else {
      // Fallback to demo mode
      logger.info('🎭 Using in-memory database for development/demo');
      global.isDemoMode = true;

      // Initialize demo service data
      const demoService = require('./src/services/demoService');
      await demoService.initializeDemoData();

      if (initResult.fallback) {
        logger.warn('⚠️  Database connection failed, running in demo mode');
      }
    }

    return true;
  } catch (error) {
    logger.error('Failed to initialize application:', error.message);
    throw error;
  }
};

// Start server (only in non-serverless environments)
const startServer = async () => {
  try {
    await initializeApp();

    // Start server
    const PORT = process.env.PORT || 3001;
    const HOST = process.env.HOST || 'localhost';

    server.listen(PORT, HOST, () => {
      logger.info(`MetroPower Dashboard API Server running on http://${HOST}:${PORT}`);
      logger.info(`Frontend Dashboard available at http://${HOST}:${PORT}`);
      logger.info(`API Documentation available at http://${HOST}:${PORT}/api-docs`);
      logger.info(`Health check available at http://${HOST}:${PORT}/health`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info('Database connected - full functionality available');
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Only start server if not in serverless environment
if (require.main === module) {
  startServer();
}

// Export for serverless deployment
module.exports = { app, server, initializeApp };
