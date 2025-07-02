/**
 * Vercel Serverless Function for Login
 * 
 * Dedicated login endpoint: /api/auth/login
 */

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../..', '.env') });

// Disable file logging in serverless environment
process.env.DISABLE_FILE_LOGGING = 'true';
process.env.LOG_LEVEL = 'error';

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are allowed for login'
    });
  }

  console.log('Login request received');

  try {
    // Basic validation
    if (!req.body?.identifier || !req.body?.password) {
      console.log('Missing identifier or password');
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Username/email and password are required'
      });
    }

    const { identifier, password } = req.body;
    console.log('Login attempt for:', identifier);

    // Set up path for backend modules
    process.env.NODE_PATH = path.join(__dirname, '../..', 'backend');
    require('module').Module._initPaths();

    // Initialize database connection with timeout
    const { connectDatabase } = require('../../backend/src/config/database');
    
    // Set a timeout for database connection
    const dbPromise = connectDatabase();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), 10000)
    );
    
    await Promise.race([dbPromise, timeoutPromise]);
    console.log('Database connected successfully');

    // Authenticate user
    const User = require('../../backend/src/models/User');
    const authResult = await User.authenticate(identifier, password);

    if (!authResult) {
      console.log('Authentication failed for:', identifier);
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid credentials or inactive account'
      });
    }

    const { user, tokens } = authResult;
    console.log('Login successful for:', user.username);

    // Return successful response
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
    
    // Provide specific error messages
    let errorMessage = 'An error occurred during authentication';
    let statusCode = 500;

    if (error.message.includes('timeout')) {
      errorMessage = 'Database connection timeout - please try again';
      statusCode = 503;
    } else if (error.message.includes('connection')) {
      errorMessage = 'Database connection error - please try again';
      statusCode = 503;
    }

    res.status(statusCode).json({
      error: 'Authentication error',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
