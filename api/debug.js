/**
 * Debug API Endpoint for Vercel Deployment
 * 
 * This endpoint helps diagnose deployment issues by checking:
 * - Environment variables
 * - Database connection
 * - Table existence
 * - User creation
 */

const path = require('path');

// Set up environment for backend modules
process.env.NODE_PATH = path.join(__dirname, '..', 'backend');
require('module').Module._initPaths();

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Override logger for serverless environment
process.env.LOG_LEVEL = 'error';
process.env.DISABLE_FILE_LOGGING = 'true';

const express = require('express');
const app = express();

app.use(express.json());

// Debug endpoint
app.get('/api/debug', async (req, res) => {
  const debug = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    checks: {}
  };

  try {
    // Check environment variables
    debug.checks.env_vars = {
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      DB_HOST: !!process.env.DB_HOST,
      DB_NAME: !!process.env.DB_NAME,
      DB_USER: !!process.env.DB_USER,
      DB_PASSWORD: !!process.env.DB_PASSWORD,
      JWT_SECRET: !!process.env.JWT_SECRET,
      JWT_REFRESH_SECRET: !!process.env.JWT_REFRESH_SECRET,
      values: {
        POSTGRES_URL: process.env.POSTGRES_URL ? process.env.POSTGRES_URL.substring(0, 30) + '...' : 'missing',
        DB_HOST: process.env.DB_HOST ? process.env.DB_HOST.substring(0, 20) + '...' : 'missing',
        DB_NAME: process.env.DB_NAME || 'missing',
        DB_USER: process.env.DB_USER || 'missing'
      }
    };

    // Check database connection
    try {
      const { connectDatabase, query } = require('../backend/src/config/database');
      await connectDatabase();
      debug.checks.database_connection = { status: 'success' };

      // Check if tables exist
      const tablesResult = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      debug.checks.tables = {
        count: tablesResult.rows.length,
        tables: tablesResult.rows.map(row => row.table_name)
      };

      // Check if users exist
      if (tablesResult.rows.some(row => row.table_name === 'users')) {
        const usersResult = await query('SELECT COUNT(*) as count FROM users');
        debug.checks.users = {
          count: parseInt(usersResult.rows[0].count)
        };

        if (debug.checks.users.count > 0) {
          const sampleUser = await query('SELECT username, email, role FROM users LIMIT 1');
          debug.checks.users.sample = sampleUser.rows[0];
        }
      } else {
        debug.checks.users = { error: 'users table does not exist' };
      }

    } catch (dbError) {
      debug.checks.database_connection = {
        status: 'error',
        error: dbError.message
      };
    }

    // Check JWT configuration
    try {
      const config = require('../backend/src/config/app');
      debug.checks.jwt_config = {
        secret_length: config.jwt.secret ? config.jwt.secret.length : 0,
        expires_in: config.jwt.expiresIn,
        refresh_secret_length: config.jwt.refreshSecret ? config.jwt.refreshSecret.length : 0
      };
    } catch (configError) {
      debug.checks.jwt_config = {
        error: configError.message
      };
    }

    res.json(debug);

  } catch (error) {
    debug.checks.general_error = {
      message: error.message,
      stack: error.stack
    };
    res.status(500).json(debug);
  }
});

// Initialize database endpoint
app.post('/api/debug/init-db', async (req, res) => {
  try {
    const fs = require('fs');
    const { connectDatabase, query } = require('../backend/src/config/database');
    
    // Connect to database
    await connectDatabase();
    
    // Check if tables exist
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    if (tablesResult.rows.length === 0) {
      // Read and execute migration file
      const migrationPath = path.join(__dirname, '..', 'backend', 'src', 'migrations', '001_create_tables.sql');
      
      if (fs.existsSync(migrationPath)) {
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        await query(migrationSQL);
        
        // Run seeder
        const { seedDatabase } = require('../backend/src/seeders/seed');
        await seedDatabase();
        
        res.json({
          success: true,
          message: 'Database initialized and seeded successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Migration file not found'
        });
      }
    } else {
      res.json({
        success: true,
        message: 'Database already initialized',
        tables: tablesResult.rows.map(row => row.table_name)
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database initialization failed',
      error: error.message
    });
  }
});

// Test login endpoint
app.post('/api/debug/test-login', async (req, res) => {
  try {
    const { identifier = 'antione.harrell@metropower.com', password = 'MetroPower2025!' } = req.body;

    console.log('Test login attempt:', { identifier, password: '***' });

    const User = require('../backend/src/models/User');
    const authResult = await User.authenticate(identifier, password);

    if (authResult) {
      res.json({
        success: true,
        message: 'Authentication successful',
        user: {
          user_id: authResult.user.user_id,
          username: authResult.user.username,
          email: authResult.user.email,
          role: authResult.user.role
        },
        token_length: authResult.tokens.accessToken.length
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Authentication failed'
      });
    }

  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
      stack: error.stack
    });
  }
});

// Test user lookup endpoint
app.get('/api/debug/test-user', async (req, res) => {
  try {
    const identifier = req.query.identifier || 'antione.harrell@metropower.com';

    console.log('Test user lookup:', { identifier });

    const User = require('../backend/src/models/User');
    const user = await User.getByIdentifier(identifier);

    if (user) {
      // Remove password hash for security
      const { password_hash, ...userWithoutPassword } = user;
      res.json({
        success: true,
        message: 'User found',
        user: userWithoutPassword,
        has_password_hash: !!password_hash,
        password_hash_length: password_hash ? password_hash.length : 0
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Test user lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
      stack: error.stack
    });
  }
});

// Test password verification endpoint
app.get('/api/debug/test-password', async (req, res) => {
  try {
    const identifier = req.query.identifier || 'antione.harrell@metropower.com';
    const password = req.query.password || 'MetroPower2025!';

    console.log('Test password verification:', { identifier, password: '***' });

    const bcrypt = require('bcryptjs');
    const User = require('../backend/src/models/User');
    const user = await User.getByIdentifier(identifier);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    res.json({
      success: true,
      message: 'Password verification test',
      user_found: true,
      has_password_hash: !!user.password_hash,
      password_hash_starts_with: user.password_hash ? user.password_hash.substring(0, 10) : null,
      password_valid: isValidPassword,
      user_active: user.is_active
    });

  } catch (error) {
    console.error('Test password verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
      stack: error.stack
    });
  }
});



// Health check
app.get('/api/debug/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'MetroPower Debug API'
  });
});

// Fix user passwords endpoint
app.get('/api/debug/fix-passwords', async (req, res) => {
  try {
    console.log('Fixing user passwords...');

    const bcrypt = require('bcryptjs');
    const { query } = require('../backend/src/config/database');

    // Auto-initialize database connection if not available
    const { connectDatabase } = require('../backend/src/config/database');
    await connectDatabase();

    // Generate correct password hashes
    const adminPasswordHash = await bcrypt.hash('MetroPower2025!', 12);
    const managerPasswordHash = await bcrypt.hash('MetroPower2025!', 12);

    console.log('Generated password hashes');

    // Update admin user password
    const adminResult = await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
      [adminPasswordHash, 'admin@metropower.com']
    );

    // Update manager user password
    const managerResult = await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
      [managerPasswordHash, 'antione.harrell@metropower.com']
    );

    console.log('Updated user passwords');

    res.json({
      success: true,
      message: 'User passwords fixed successfully',
      admin_updated: adminResult.rowCount > 0,
      manager_updated: managerResult.rowCount > 0,
      admin_rows: adminResult.rowCount,
      manager_rows: managerResult.rowCount
    });

  } catch (error) {
    console.error('Fix passwords error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = app;
