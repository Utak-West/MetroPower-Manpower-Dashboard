/**
 * Database Configuration and Connection Management
 *
 * Handles database connections with fallback to in-memory storage for development.
 * Supports both PostgreSQL (production) and in-memory storage (development/demo).
 */

const config = require('./app');
const logger = require('../utils/logger');

// Use in-memory storage for development/demo if PostgreSQL is not available
const useMemoryDB = process.env.USE_MEMORY_DB === 'true' || process.env.NODE_ENV === 'development';

let db = null;

let isConnected = false;

// In-memory database for development/demo
let memoryDB = {
  users: [],
  positions: [],
  projects: [],
  assignments: []
};

// PostgreSQL setup function (only loaded when needed)
let createPool = null;

if (useMemoryDB) {
  logger.info('Using in-memory database for development/demo');
} else {
  // PostgreSQL setup for production
  const { Pool } = require('pg');

  /**
   * Create database connection pool
   * @returns {Pool} PostgreSQL connection pool
   */
  createPool = function() {
    const dbConfig = {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,

      // Connection pool settings
      min: config.database.pool.min,
      max: config.database.pool.max,
      acquireTimeoutMillis: config.database.pool.acquire,
      idleTimeoutMillis: config.database.pool.idle,

      // Additional settings for reliability
      connectionTimeoutMillis: 10000,
      query_timeout: 30000,
      statement_timeout: 30000,

      // Handle connection errors
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    };

    // Log connection attempt (without password)
    const logConfig = { ...dbConfig };
    delete logConfig.password;
    logger.info('Creating PostgreSQL connection pool', logConfig);

    return new Pool(dbConfig);
  };
}

/**
 * Connect to the database
 * @returns {Promise<void>}
 */
async function connectDatabase() {
  if (isConnected) {
    return;
  }

  try {
    if (useMemoryDB) {
      // Initialize in-memory database with demo data
      await initializeMemoryDB();
      isConnected = true;
      logger.info('In-memory database connection established');
    } else {
      // PostgreSQL connection
      if (!db) {
        db = createPool();
      }

      // Test the connection
      const client = await db.connect();
      await client.query('SELECT NOW()');
      client.release();

      isConnected = true;
      logger.info('PostgreSQL database connection established successfully');

      // Handle pool errors
      db.on('error', (err) => {
        logger.error('Database pool error:', err);
        isConnected = false;
      });

      db.on('connect', () => {
        logger.debug('New database connection established');
      });

      db.on('remove', () => {
        logger.debug('Database connection removed from pool');
      });
    }

  } catch (error) {
    logger.error('Failed to connect to database:', error);
    isConnected = false;
    throw error;
  }
}

/**
 * Initialize in-memory database with demo data
 */
async function initializeMemoryDB() {
  if (!useMemoryDB) return;

  const bcrypt = require('bcryptjs');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('MetroPower2025!', 12);

  memoryDB.users = [
    {
      user_id: 1,
      username: 'admin',
      email: 'admin@metropower.com',
      password_hash: hashedPassword,
      first_name: 'System',
      last_name: 'Administrator',
      role: 'Admin',
      is_active: true,
      last_login: null,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      user_id: 2,
      username: 'antione.harrell',
      email: 'antione.harrell@metropower.com',
      password_hash: await bcrypt.hash('password123', 12),
      first_name: 'Antione',
      last_name: 'Harrell',
      role: 'Project Manager',
      is_active: true,
      last_login: null,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  memoryDB.positions = [
    { position_id: 1, name: 'Electrician', code: 'ELEC', color_code: '#007bff', created_at: new Date() },
    { position_id: 2, name: 'Field Supervisor', code: 'FSUP', color_code: '#28a745', created_at: new Date() },
    { position_id: 3, name: 'Apprentice', code: 'APPR', color_code: '#ffc107', created_at: new Date() },
    { position_id: 4, name: 'General Laborer', code: 'GLAB', color_code: '#6c757d', created_at: new Date() },
    { position_id: 5, name: 'Temp', code: 'TEMP', color_code: '#dc3545', created_at: new Date() }
  ];

  memoryDB.projects = [
    {
      project_id: 'DEMO-001',
      name: 'Tucker Branch Demo Project',
      number: 'TB-2025-001',
      status: 'Active',
      start_date: new Date('2025-01-01'),
      end_date: new Date('2025-12-31'),
      location: 'Tucker Branch',
      manager_id: 2,
      description: 'Demo project for MetroPower Dashboard',
      budget: 100000.00,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  logger.info('In-memory database initialized with demo data');
}

/**
 * Execute a database query
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function query(text, params = []) {
  const start = Date.now();

  try {
    // Ensure we have a connection
    if (!isConnected) {
      await connectDatabase();
    }

    let result;

    if (useMemoryDB) {
      // Handle in-memory database queries
      result = await executeMemoryQuery(text, params);
    } else {
      // PostgreSQL query
      result = await db.query(text, params);
    }

    const duration = Date.now() - start;

    // Log query for debugging (only in debug mode)
    if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('Database query executed', {
        query: text.replace(/\s+/g, ' ').trim(),
        params: params.length > 0 ? '[PARAMS]' : 'none',
        duration: `${duration}ms`,
        rows: result.rows.length
      });
    }

    return result;

  } catch (error) {
    const duration = Date.now() - start;

    logger.error('Database query failed', {
      query: text.replace(/\s+/g, ' ').trim(),
      params: params.length > 0 ? '[PARAMS]' : 'none',
      duration: `${duration}ms`,
      error: error.message
    });

    throw error;
  }
}

/**
 * Execute query against in-memory database
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function executeMemoryQuery(text, params = []) {
  const queryLower = text.toLowerCase().trim();

  // Handle SELECT NOW() or version queries
  if (queryLower.includes('select now()') || queryLower.includes('current_time')) {
    return {
      rows: [{ current_time: new Date(), version: 'In-Memory Database v1.0' }],
      rowCount: 1
    };
  }

  // Handle user authentication queries
  if (queryLower.includes('select') && queryLower.includes('users') && queryLower.includes('email')) {
    const email = params[0];
    const user = memoryDB.users.find(u => u.email === email || u.username === email);
    logger.debug('User authentication query', { email, userFound: !!user });
    return {
      rows: user ? [user] : [],
      rowCount: user ? 1 : 0
    };
  }

  // Handle user count queries
  if (queryLower.includes('count') && queryLower.includes('users')) {
    return {
      rows: [{ count: memoryDB.users.length.toString() }],
      rowCount: 1
    };
  }

  // Handle table existence queries
  if (queryLower.includes('information_schema.tables') && queryLower.includes('users')) {
    return {
      rows: [{ table_name: 'users' }],
      rowCount: 1
    };
  }

  // Handle user selection by ID
  if (queryLower.includes('select') && queryLower.includes('users') && queryLower.includes('user_id')) {
    const userId = params[0];
    const user = memoryDB.users.find(u => u.user_id === parseInt(userId));
    return {
      rows: user ? [user] : [],
      rowCount: user ? 1 : 0
    };
  }

  // Handle user last_login update
  if (queryLower.includes('update') && queryLower.includes('users') && queryLower.includes('last_login')) {
    const userId = params[0];
    const userIndex = memoryDB.users.findIndex(u => u.user_id === parseInt(userId));
    if (userIndex !== -1) {
      memoryDB.users[userIndex].last_login = new Date();
      memoryDB.users[userIndex].updated_at = new Date();
      logger.debug('Updated user last_login', { userId });
    }
    return {
      rows: [],
      rowCount: userIndex !== -1 ? 1 : 0
    };
  }

  // Handle position queries
  if (queryLower.includes('select') && queryLower.includes('positions')) {
    return {
      rows: memoryDB.positions,
      rowCount: memoryDB.positions.length
    };
  }

  // Handle project queries
  if (queryLower.includes('select') && queryLower.includes('projects')) {
    return {
      rows: memoryDB.projects,
      rowCount: memoryDB.projects.length
    };
  }

  // Default response for unhandled queries
  logger.warn('Unhandled memory database query:', text);
  return {
    rows: [],
    rowCount: 0
  };
}

/**
 * Execute a transaction
 * @param {Function} callback - Function to execute within transaction
 * @returns {Promise<any>} Transaction result
 */
async function transaction(callback) {
  if (!isConnected) {
    await connectDatabase();
  }

  if (useMemoryDB) {
    // For memory DB, just execute the callback with the query function
    return await callback(query);
  } else {
    // PostgreSQL transaction
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Create a query function bound to this client
      const transactionQuery = (text, params) => client.query(text, params);

      const result = await callback(transactionQuery);

      await client.query('COMMIT');
      return result;

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction failed:', error);
      throw error;

    } finally {
      client.release();
    }
  }
}

/**
 * Get connection pool status
 * @returns {Object} Pool status information
 */
function getPoolStatus() {
  if (useMemoryDB) {
    return {
      connected: isConnected,
      type: 'memory',
      users: memoryDB.users.length,
      positions: memoryDB.positions.length,
      projects: memoryDB.projects.length
    };
  }

  if (!db) {
    return { connected: false, pool: null };
  }

  return {
    connected: isConnected,
    type: 'postgresql',
    totalCount: db.totalCount,
    idleCount: db.idleCount,
    waitingCount: db.waitingCount
  };
}

/**
 * Close database connection pool
 * @returns {Promise<void>}
 */
async function closeDatabase() {
  if (useMemoryDB) {
    logger.info('Closing in-memory database');
    isConnected = false;
  } else if (db) {
    logger.info('Closing database connection pool');
    await db.end();
    db = null;
    isConnected = false;
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});

module.exports = {
  connectDatabase,
  query,
  transaction,
  getPoolStatus,
  closeDatabase,
  get pool() { return db; },
  get isConnected() { return isConnected; }
};
