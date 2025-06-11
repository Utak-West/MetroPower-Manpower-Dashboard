/**
 * Database Configuration and Connection Management
 * 
 * Handles PostgreSQL database connection, pooling, and query execution
 * for the MetroPower Dashboard application.
 */

const { Pool } = require('pg');
const config = require('./app');
const logger = require('../utils/logger');

// Database connection pool
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
  };

  pool = new Pool(dbConfig);

  // Handle pool errors
  pool.on('error', (err) => {
    logger.error('Unexpected error on idle client:', err);
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

    // Test the connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    client.release();

    logger.info('Database connection established successfully');
    logger.info(`Database time: ${result.rows[0].current_time}`);
    logger.debug(`PostgreSQL version: ${result.rows[0].version}`);

    global.isDemoMode = false;
    return pool;
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    logger.warn('Switching to demo mode with in-memory data');
    global.isDemoMode = true;
    throw error;
  }
};

/**
 * Execute a query with parameters
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
const query = async (text, params = []) => {
  // Use demo service if in demo mode
  if (global.isDemoMode) {
    const demoService = require('../services/demoService');
    return await demoService.query(text, params);
  }

  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    logger.debug(`Query executed in ${duration}ms:`, {
      query: text,
      params: params,
      rowCount: result.rowCount
    });

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`Query failed after ${duration}ms:`, {
      query: text,
      params: params,
      error: error.message
    });
    throw error;
  }
};

/**
 * Execute a transaction
 * @param {Function} callback - Function containing queries to execute in transaction
 * @returns {Promise<any>} Transaction result
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get a client from the pool for manual transaction management
 * @returns {Promise<Object>} Database client
 */
const getClient = async () => {
  return await pool.connect();
};

/**
 * Close the database connection pool
 */
const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection pool closed');
  }
};

/**
 * Get database connection status
 * @returns {Object} Connection status information
 */
const getConnectionStatus = () => {
  if (!pool) {
    return {
      connected: false,
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0
    };
  }

  return {
    connected: true,
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
};

/**
 * Health check for database connection
 * @returns {Promise<Object>} Health check result
 */
const healthCheck = async () => {
  try {
    const result = await query('SELECT 1 as health_check');
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: 'fast',
      connection: getConnectionStatus()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      connection: getConnectionStatus()
    };
  }
};

/**
 * Common database utility functions
 */
const utils = {
  /**
   * Build WHERE clause from filters
   * @param {Object} filters - Filter object
   * @param {number} startIndex - Starting parameter index
   * @returns {Object} WHERE clause and parameters
   */
  buildWhereClause: (filters, startIndex = 1) => {
    const conditions = [];
    const params = [];
    let paramIndex = startIndex;

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          const placeholders = value.map(() => `$${paramIndex++}`).join(',');
          conditions.push(`${key} IN (${placeholders})`);
          params.push(...value);
        } else if (typeof value === 'string' && value.includes('%')) {
          conditions.push(`${key} ILIKE $${paramIndex++}`);
          params.push(value);
        } else {
          conditions.push(`${key} = $${paramIndex++}`);
          params.push(value);
        }
      }
    });

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params
    };
  },

  /**
   * Build pagination clause
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Items per page
   * @returns {Object} Pagination clause and offset
   */
  buildPaginationClause: (page = 1, limit = 50) => {
    const offset = (page - 1) * limit;
    return {
      paginationClause: `LIMIT ${limit} OFFSET ${offset}`,
      offset,
      limit
    };
  },

  /**
   * Build ORDER BY clause
   * @param {string} sortBy - Column to sort by
   * @param {string} sortOrder - Sort order (ASC/DESC)
   * @returns {string} ORDER BY clause
   */
  buildOrderClause: (sortBy = 'created_at', sortOrder = 'DESC') => {
    const validOrders = ['ASC', 'DESC'];
    const order = validOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    return `ORDER BY ${sortBy} ${order}`;
  }
};

module.exports = {
  connectDatabase,
  closeDatabase,
  query,
  transaction,
  getClient,
  getConnectionStatus,
  healthCheck,
  utils
};
