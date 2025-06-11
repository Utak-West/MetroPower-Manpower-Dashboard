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

// Import the main server application
const { app } = require('../backend/server');

// Export the Express app as a Vercel serverless function
module.exports = app;
