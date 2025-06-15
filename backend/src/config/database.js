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
    return new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
      min: config.database.pool.min,
      max: config.database.pool.max,
      acquireTimeoutMillis: config.database.pool.acquire,
      idleTimeoutMillis: config.database.pool.idle,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
      query_timeout: 30000,
      application_name: 'MetroPower Dashboard'
    })
  }
  
  // Fall back to standard database configuration
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
    // Check if demo mode is enabled
    if (process.env.USE_MEMORY_DB === 'true' || process.env.DEMO_MODE_ENABLED === 'true') {
      logger.info('Demo mode enabled - skipping database connection')
      return null
    }

    if (!pool) {
      pool = createPool()
    }

    // Test the connection with retry logic
    let retries = 3
    let lastError

    while (retries > 0) {
      try {
        const client = await pool.connect()
        const result = await client.query('SELECT NOW() as current_time, version() as version')
        client.release()

        logger.info('Database connection established successfully')
        logger.info(`Database time: ${result.rows[0].current_time}`)
        logger.debug(`PostgreSQL version: ${result.rows[0].version}`)

        return pool
      } catch (error) {
        lastError = error
        retries--
        if (retries > 0) {
          logger.warn(`Database connection failed, retrying... (${retries} attempts left)`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }

    throw lastError
  } catch (error) {
    logger.error('Failed to connect to database after all retries:', error)
    throw error
  }
}

/**
 * Execute a database query with error handling
 */
const query = async (text, params = []) => {
  // Handle demo mode queries
  if (global.isDemoMode || process.env.USE_MEMORY_DB === 'true') {
    return executeMemoryQuery(text, params)
  }

  if (!pool) {
    throw new Error('Database pool not initialized')
  }

  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start

    logger.debug('Executed query', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      rows: result.rowCount
    })

    return result
  } catch (error) {
    const duration = Date.now() - start
    logger.error('Query error', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      error: error.message
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
