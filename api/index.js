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

  // Initialize the app for serverless
  if (serverModule.initializeApp) {
    serverModule.initializeApp().catch(error => {
      console.error('Failed to initialize app:', error);
    });
  }
} catch (error) {
  console.error('Failed to load server:', error);

  // Create a minimal error app
  const express = require('express');
  app = express();

  app.use((req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: 'Please check your environment variables and database configuration',
      details: error.message
    });
  });
}

// Export the Express app as a Vercel serverless function
module.exports = app;
