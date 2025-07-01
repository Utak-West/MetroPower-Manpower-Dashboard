/**
 * Authentication API Serverless Function
 *
 * Handles user authentication for the MetroPower Dashboard
 * in the Vercel serverless environment.
 */

// Simple serverless function handler
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { url, method } = req;

    // Route handling
    if (url === '/api/auth/health' && method === 'GET') {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'MetroPower Auth API'
      });
      return;
    }

    if (url === '/api/auth/login' && method === 'POST') {
      try {
        console.log('Login attempt received:', {
          identifier: req.body?.identifier,
          password: '***',
          body: req.body ? Object.keys(req.body) : 'no body'
        });

        // Basic validation
        if (!req.body?.identifier || !req.body?.password) {
          console.log('Missing identifier or password');
          return res.status(400).json({
            error: 'Validation failed',
            message: 'Username/email and password are required'
          });
        }

        const { identifier, password } = req.body;

        // Initialize database connection
        const { connectDatabase } = require('../backend/src/config/database');
        await connectDatabase();

        // Authenticate user
        const User = require('../backend/src/models/User');
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
        return;

      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
          error: 'Authentication error',
          message: 'An error occurred during authentication',
          details: error.message
        });
        return;
      }
    }


    // Default 404 response
    res.status(404).json({
      error: 'Not Found',
      message: `Endpoint ${method} ${url} not found`
    });

  } catch (error) {
    console.error('Auth API error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};
