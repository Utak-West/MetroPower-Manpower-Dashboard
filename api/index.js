/**
 * Vercel Serverless Function Entry Point
 *
 * Lightweight serverless function for MetroPower Dashboard API
 * Optimized for Vercel deployment with minimal initialization overhead
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Disable file logging in serverless environment
process.env.DISABLE_FILE_LOGGING = 'true';
process.env.LOG_LEVEL = 'error';

// Create Express app
const app = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Import and setup authentication routes
try {
  // Set up path for backend modules
  process.env.NODE_PATH = path.join(__dirname, '..', 'backend');
  require('module').Module._initPaths();

  // Import authentication routes
  const authRoutes = require('../backend/src/routes/auth');
  app.use('/api/auth', authRoutes);

  // Import other essential routes
  const dashboardRoutes = require('../backend/src/routes/dashboard');
  app.use('/api/dashboard', dashboardRoutes);

  console.log('✅ Routes loaded successfully');

} catch (error) {
  console.error('❌ Failed to load routes:', error);

  // Fallback authentication endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Username/email and password are required'
        });
      }

      // Initialize database connection
      const { connectDatabase } = require('../backend/src/config/database');
      await connectDatabase();

      // Authenticate user
      const User = require('../backend/src/models/User');
      const authResult = await User.authenticate(identifier, password);

      if (!authResult) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid credentials or inactive account'
        });
      }

      const { user, tokens } = authResult;

      res.json({
        message: 'Login successful',
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          last_login: user.last_login
        },
        accessToken: tokens.accessToken
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Authentication error',
        message: 'An error occurred during authentication',
        details: error.message
      });
    }
  });
}

// Default 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Serverless function error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// Export the Express app as a Vercel serverless function
module.exports = app;
