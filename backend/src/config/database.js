/**
 * Database Configuration
 *
 * PostgreSQL connection configuration with connection pooling,
 * and error handling for the MetroPower Dashboard.
 *
 * Copyright 2025 The HigherSelf Network
 */

const { Pool } = require('pg')
const config = require('./app')
const logger = require('../utils/logger')

let pool = null

/**
 * Create and configure database connection pool
 */
const createPool = () => {
  // Check if Vercel Postgres environment variables are available
  if (process.env.POSTGRES_URL) {
    logger.info('Using Vercel Postgres connection string')

    // Optimized settings for serverless/production deployment
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = process.env.VERCEL === '1';

    return new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
      min: isVercel ? 0 : config.database.pool.min, // No minimum connections for serverless
      max: isVercel ? 3 : config.database.pool.max, // Limit max connections for serverless
      acquireTimeoutMillis: isProduction ? 15000 : config.database.pool.acquire, // Increased timeout for production
      idleTimeoutMillis: isVercel ? 10000 : config.database.pool.idle, // Shorter idle timeout for serverless
      connectionTimeoutMillis: isProduction ? 15000 : 10000, // Increased connection timeout
      statement_timeout: isProduction ? 15000 : 30000, // Shorter statement timeout
      query_timeout: isProduction ? 15000 : 30000, // Shorter query timeout
      application_name: 'MetroPower Dashboard'
    })
  }
  
  // Fall back to standard database configuration
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';

  const dbConfig = {
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    min: isVercel ? 0 : config.database.pool.min,
    max: isVercel ? 3 : config.database.pool.max,
    acquireTimeoutMillis: isProduction ? 15000 : config.database.pool.acquire,
    idleTimeoutMillis: isVercel ? 10000 : config.database.pool.idle,
    connectionTimeoutMillis: isProduction ? 15000 : 10000,
    statement_timeout: isProduction ? 15000 : 30000,
    query_timeout: isProduction ? 15000 : 30000,
    application_name: 'MetroPower Dashboard'
  }

  pool = new Pool(dbConfig)

  // Handle pool errors
  pool.on('error', (err) => {
    logger.error('Unexpected error on idle client:', err)
    // Don't exit the process, just log the error
  })

  // Handle pool connection
  pool.on('connect', (client) => {
    logger.debug('New client connected to database')
  })

  // Handle pool removal
  pool.on('remove', (client) => {
    logger.debug('Client removed from pool')
  })

  return pool
}

/**
 * Connect to the database and test the connection
 */
const connectDatabase = async () => {
  try {
    // Check if we should use persistent database
    const useMemoryDB = process.env.USE_MEMORY_DB === 'true'
    const isDemoMode = process.env.DEMO_MODE_ENABLED === 'true'

    // Only use in-memory for local development, not production
    if (useMemoryDB && process.env.NODE_ENV !== 'production') {
      logger.info('Using in-memory database for local development')
      return null
    }

    // For production or when persistent storage is needed, use real database
    logger.info('Initializing persistent database connection...')

    if (!pool) {
      pool = createPool()
    }

    // Test the connection
    const client = await pool.connect()
    const result = await client.query('SELECT NOW() as current_time, version() as version')
    client.release()

    logger.info('Database connected successfully', {
      currentTime: result.rows[0].current_time,
      version: result.rows[0].version.substring(0, 50) + '...'
    })

    return pool
  } catch (error) {
    logger.error('Database connection failed:', error)

    // Fallback to demo service for development only
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('Falling back to in-memory database for development')
      return null
    }

    throw error
  }
}

/**
 * Execute a database query with error handling
 */
const query = async (text, params = []) => {
  try {
    // Auto-initialize database connection if not available
    if (!pool && process.env.POSTGRES_URL) {
      logger.info('Auto-initializing database connection for query')
      await connectDatabase()
    }

    // Check if we have a real database connection
    if (pool) {
      const client = await pool.connect()
      try {
        const result = await client.query(text, params)
        return result
      } finally {
        client.release()
      }
    }

    // Fallback to in-memory queries for development
    if (process.env.NODE_ENV !== 'production') {
      return executeMemoryQuery(text, params)
    }

    throw new Error('No database connection available')
  } catch (error) {
    logger.error('Database query error:', {
      error: error.message,
      query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      params: params.length
    })
    throw error
  }
}

/**
 * Execute query in memory for demo mode
 */
const executeMemoryQuery = async (text, params = []) => {
  logger.debug('Executing memory query', {
    text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    params: params.length
  })

  // Handle UPDATE queries for last_login
  if (text.includes('UPDATE users SET last_login')) {
    return { rowCount: 1, rows: [] }
  }

  // Handle other common queries
  if (text.includes('SELECT NOW()')) {
    return {
      rowCount: 1,
      rows: [{ current_time: new Date(), version: 'Demo Mode PostgreSQL Compatible' }]
    }
  }

  // Default response for unhandled queries
  return { rowCount: 0, rows: [] }
}

/**
 * Execute a transaction with automatic rollback on error
 */
const transaction = async (callback) => {
  if (!pool) {
    throw new Error('Database pool not initialized')
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Get database connection status
 */
const getConnectionStatus = () => {
  if (!pool) {
    return {
      status: 'disconnected',
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0
    }
  }

  return {
    status: 'connected',
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  }
}

/**
 * Close database connection pool
 */
const closeDatabase = async () => {
  if (pool) {
    try {
      await pool.end()
      logger.info('Database connection pool closed')
    } catch (error) {
      logger.error('Error closing database pool:', error)
    } finally {
      pool = null
    }
  }
}

/**
 * Health check for database
 */
const healthCheck = async () => {
  try {
    if (!pool) {
      throw new Error('Database pool not initialized')
    }

    const client = await pool.connect()
    await client.query('SELECT 1 as health_check')
    client.release()

    return {
      status: 'healthy',
      message: 'Database connection is working',
      timestamp: new Date().toISOString(),
      connectionCount: pool.totalCount
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

module.exports = {
  connectDatabase,
  query,
  transaction,
  getConnectionStatus,
  closeDatabase,
  healthCheck,
  getPool: () => pool
}
