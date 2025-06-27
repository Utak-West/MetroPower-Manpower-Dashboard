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
let initializationPromise = null;

try {
  // Import the main server application
  const serverModule = require('../backend/server');
  app = serverModule.app;

  // Initialize the app for serverless (with proper error handling)
  if (serverModule.initializeApp) {
    initializationPromise = serverModule.initializeApp().catch(error => {
      console.error('Failed to initialize app:', error);
      console.error('Error stack:', error.stack);
      // Don't throw here, let requests handle the error
      return { error: error.message, stack: error.stack };
    });
  }
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

// Add initialization check middleware for the main app
if (initializationPromise) {
  const originalApp = app;
  const express = require('express');
  const wrappedApp = express();

  wrappedApp.use(async (req, res, next) => {
    try {
      // Wait for initialization to complete
      const initResult = await initializationPromise;
      if (initResult && initResult.error) {
        console.error('Initialization failed:', initResult.error);
        console.error('Stack trace:', initResult.stack);
        return res.status(500).json({
          error: 'Application initialization failed',
          message: initResult.error,
          details: initResult.stack,
          timestamp: new Date().toISOString(),
          path: req.originalUrl
        });
      }
      // Forward to the original app
      originalApp(req, res, next);
    } catch (error) {
      res.status(500).json({
        error: 'Application initialization error',
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      });
    }
  });

  app = wrappedApp;
}

// Export the Express app as a Vercel serverless function
module.exports = app;
