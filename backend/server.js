/**
 * MetroPower Manpower Dashboard - Main Server Entry Point
 * 
 * This is the main server file that initializes the Express application,
 * sets up middleware, routes, and starts the server.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Import configurations and utilities
const config = require('./src/config/app');
const logger = require('./src/utils/logger');
const { connectDatabase } = require('./src/config/database');

// Import middleware
const errorHandler = require('./src/middleware/errorHandler');
const authMiddleware = require('./src/middleware/auth');

// Import routes
const authRoutes = require('./src/routes/auth');
const employeeRoutes = require('./src/routes/employees');
const projectRoutes = require('./src/routes/projects');
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
    methods: ['GET', 'POST']
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
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
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// General middleware
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use('/uploads', express.static('uploads'));
app.use('/exports', express.static('exports'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'MetroPower Manpower Dashboard API',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', authMiddleware, employeeRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/assignments', authMiddleware, assignmentRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/exports', authMiddleware, exportRoutes);
app.use('/api/archives', authMiddleware, archiveRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/users', authMiddleware, userRoutes);

// API Documentation (Swagger)
if (process.env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerDocument = require('./docs/swagger.json');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  // Join user to their role-based room
  socket.on('join-room', (data) => {
    const { userId, role } = data;
    socket.join(`user-${userId}`);
    socket.join(`role-${role}`);
    logger.info(`User ${userId} joined rooms: user-${userId}, role-${role}`);
  });
  
  // Handle assignment updates
  socket.on('assignment-update', (data) => {
    // Broadcast to all connected clients
    socket.broadcast.emit('assignment-changed', data);
    logger.info(`Assignment update broadcasted: ${JSON.stringify(data)}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.method} ${req.originalUrl} was not found.`,
    availableEndpoints: [
      'GET /health',
      'POST /api/auth/login',
      'GET /api/employees',
      'GET /api/projects',
      'GET /api/assignments',
      'GET /api/dashboard/current',
      'GET /api-docs (development only)'
    ]
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database connection for serverless
const initializeApp = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize app:', error);
    return false;
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
      logger.info(`🚀 MetroPower Dashboard API Server running on http://${HOST}:${PORT}`);
      logger.info(`📚 API Documentation available at http://${HOST}:${PORT}/api-docs`);
      logger.info(`🏥 Health check available at http://${HOST}:${PORT}/health`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
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

// Initialize app for serverless or start server for traditional deployment
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  // For Vercel/serverless deployment, just initialize the app
  initializeApp().catch(error => {
    logger.error('Failed to initialize app for serverless:', error);
  });
} else {
  // For traditional deployment, start the server
  startServer();
}

module.exports = { app, server, io, initializeApp };
