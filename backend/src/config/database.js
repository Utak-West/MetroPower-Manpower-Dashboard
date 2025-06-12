/**
 * Database Configuration
 *
 * PostgreSQL connection configuration with connection pooling,
 * error handling, and demo mode fallback for the MetroPower Dashboard.
 *
 * Copyright 2025 The HigherSelf Network
 */

const { Pool } = require('pg');
const config = require('./app');
const logger = require('../utils/logger');

let pool = null;

/**
 * Create and configure database connection pool
 */
const createPool = () => {
  const dbConfig = {
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    min: config.database.pool.min,
    max: config.database.pool.max,
    acquireTimeoutMillis: config.database.pool.acquire,
    idleTimeoutMillis: config.database.pool.idle,
    connectionTimeoutMillis: 10000,
    statement_timeout: 30000,
    query_timeout: 30000,
    application_name: 'MetroPower Dashboard'
  };

  pool = new Pool(dbConfig);

  // Handle pool errors
  pool.on('error', (err) => {
    logger.error('Unexpected error on idle client:', err);
    // Don't exit the process, just log the error
  });

  // Handle pool connection
  pool.on('connect', (client) => {
    logger.debug('New client connected to database');
  });

  // Handle pool removal
  pool.on('remove', (client) => {
    logger.debug('Client removed from pool');
  });

  return pool;
};

/**
 * Connect to the database and test the connection
 */
const connectDatabase = async () => {
  try {
    if (!pool) {
      createPool();
    }

    // Test the connection with retry logic
    let retries = 3;
    let lastError;

    while (retries > 0) {
      try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time, version() as version');
        client.release();

        logger.info('Database connection established successfully');
        logger.info(`Database time: ${result.rows[0].current_time}`);
        logger.debug(`PostgreSQL version: ${result.rows[0].version}`);

        global.isDemoMode = false;
        return pool;
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          logger.warn(`Database connection failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    throw lastError;
  } catch (error) {
    logger.error('Failed to connect to database after all retries:', error);
    logger.warn('Switching to demo mode with in-memory data');
    global.isDemoMode = true;

    // Initialize demo service
    require('../services/demoService');

    throw error;
  }
};

/**
 * Execute a database query with error handling
 */
const query = async (text, params = []) => {
  if (global.isDemoMode) {
    throw new Error('Database operations not available in demo mode');
  }

  if (!pool) {
    throw new Error('Database pool not initialized');
  }

  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    logger.debug('Executed query', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      rows: result.rowCount
    });

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Query error', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      error: error.message
    });
    throw error;
  }
};

/**
 * Execute a transaction with automatic rollback on error
 */
const transaction = async (callback) => {
  if (global.isDemoMode) {
    throw new Error('Transactions not available in demo mode');
  }

  if (!pool) {
    throw new Error('Database pool not initialized');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get database connection status
 */
const getConnectionStatus = () => {
  if (global.isDemoMode) {
    return {
      status: 'demo',
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0
    };
  }

  if (!pool) {
    return {
      status: 'disconnected',
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0
    };
  }

  return {
    status: 'connected',
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
};

/**
 * Close database connection pool
 */
const closeDatabase = async () => {
  if (pool) {
    try {
      await pool.end();
      logger.info('Database connection pool closed');
    } catch (error) {
      logger.error('Error closing database pool:', error);
    } finally {
      pool = null;
    }
  }
};

/**
 * Health check for database
 */
const healthCheck = async () => {
  if (global.isDemoMode) {
    return {
      status: 'demo',
      message: 'Running in demo mode',
      timestamp: new Date().toISOString()
    };
  }

  try {
    if (!pool) {
      throw new Error('Database pool not initialized');
    }

    const client = await pool.connect();
    const result = await client.query('SELECT 1 as health_check');
    client.release();

    return {
      status: 'healthy',
      message: 'Database connection is working',
      timestamp: new Date().toISOString(),
      connectionCount: pool.totalCount
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = {
  connectDatabase,
  query,
  transaction,
  getConnectionStatus,
  closeDatabase,
  healthCheck,
  getPool: () => pool
};
