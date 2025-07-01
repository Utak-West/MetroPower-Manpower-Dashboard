/**
 * Vercel Serverless Function Entry Point
 *
 * This file serves as the main entry point for Vercel deployment,
 * handling all API routes through a single serverless function.
 */

const path = require('path');

// Set up environment for backend modules
process.env.NODE_PATH = path.join(__dirname, '..', 'backend');
require('module').Module._initPaths();

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Override logger for serverless environment
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';

// Disable file logging in serverless environment
if (process.env.VERCEL) {
  process.env.DISABLE_FILE_LOGGING = 'true';
}

let app;

try {
  // Import the main server application
  const serverModule = require('../backend/server');
  app = serverModule.app;

  // Add database initialization middleware for serverless
  const { healthCheckMiddleware } = require('../backend/src/middleware/database-init');

  // Create a wrapper app that handles initialization
  const express = require('express');
  const wrappedApp = express();

  // Add the database initialization middleware
  wrappedApp.use(healthCheckMiddleware);

  // Forward all requests to the main app after initialization
  wrappedApp.use((req, res, next) => {
    app(req, res, next);
  });

  app = wrappedApp;

} catch (error) {
  console.error('Failed to load server:', error);

  // Create a minimal error app
  const express = require('express');
  app = express();

  // Add basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(async (req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: 'Please check your environment variables and database configuration',
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  });
}



// Export the Express app as a Vercel serverless function
module.exports = app;
