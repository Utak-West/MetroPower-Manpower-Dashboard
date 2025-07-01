/**
 * Runtime Database Initialization
 * 
 * This module handles database initialization at runtime, including:
 * - Connection establishment
 * - Schema creation/migration
 * - Initial data seeding
 * 
 * This replaces build-time database operations to prevent deployment timeouts.
 */

const fs = require('fs');
const path = require('path');
const { connectDatabase, query } = require('../config/database');
const logger = require('./logger');

let isInitialized = false;
let initializationPromise = null;

/**
 * Initialize database at runtime
 * This function is idempotent and can be called multiple times safely
 */
async function initializeDatabase() {
  // Return existing promise if initialization is already in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Return immediately if already initialized
  if (isInitialized) {
    return true;
  }

  // Create initialization promise
  initializationPromise = performInitialization();
  
  try {
    const result = await initializationPromise;
    isInitialized = true;
    return result;
  } catch (error) {
    // Reset promise on failure so it can be retried
    initializationPromise = null;
    throw error;
  }
}

/**
 * Perform the actual database initialization
 */
async function performInitialization() {
  const startTime = Date.now();
  logger.info('🚀 Starting runtime database initialization...');

  try {
    // Check if demo mode is enabled
    if (process.env.DEMO_MODE_ENABLED === 'true' || process.env.USE_MEMORY_DB === 'true') {
      logger.info('🎭 Demo mode enabled - skipping database initialization');
      return { success: true, mode: 'demo' };
    }

    // Connect to database with timeout
    logger.info('🔗 Establishing database connection...');
    let connectionTimeout;

    try {
      connectionTimeout = setTimeout(() => {
        throw new Error('Database connection timeout after 15 seconds');
      }, 15000);

      await connectDatabase();
      clearTimeout(connectionTimeout);
      logger.info('✅ Database connection established');
    } catch (error) {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      throw error;
    }

    // Check if tables exist
    logger.info('🔍 Checking database schema...');
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const existingTables = tablesResult.rows.map(row => row.table_name);
    logger.info(`📋 Found ${existingTables.length} existing tables: ${existingTables.join(', ')}`);

    // Run migrations if needed
    if (existingTables.length === 0) {
      logger.info('🔧 No tables found. Running initial migration...');
      await runInitialMigration();
    } else {
      logger.info('✅ Database schema already exists');
      
      // Check for pending migrations
      await checkAndRunPendingMigrations();
    }

    // Verify critical tables exist
    await verifyCriticalTables();

    const initTime = Date.now() - startTime;
    logger.info(`🎉 Database initialization completed successfully in ${initTime}ms`);
    
    return { 
      success: true, 
      mode: 'database',
      initTime,
      tablesCount: existingTables.length
    };

  } catch (error) {
    const initTime = Date.now() - startTime;
    logger.error(`❌ Database initialization failed after ${initTime}ms:`, error);

    // Check if we should fall back to demo mode
    if (shouldFallbackToDemo(error)) {
      logger.warn('⚠️  Falling back to demo mode due to database error');
      logger.info('🎭 Initializing demo mode...');

      // Set demo mode flag
      global.isDemoMode = true;

      return {
        success: true,
        mode: 'demo',
        fallback: true,
        initTime,
        error: error.message
      };
    }

    // For non-recoverable errors, still return success but indicate the issue
    logger.error('❌ Non-recoverable database error, but continuing with demo mode');
    global.isDemoMode = true;

    return {
      success: true,
      mode: 'demo',
      fallback: true,
      initTime,
      error: error.message,
      forceDemo: true
    };
  }
}

/**
 * Run initial database migration
 */
async function runInitialMigration() {
  const migrationPath = path.join(__dirname, '..', 'migrations', '001_create_tables.sql');
  
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Initial migration file not found: ${migrationPath}`);
  }

  logger.info('📄 Reading migration file...');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  logger.info('⚡ Executing initial migration...');
  await query(migrationSQL);
  
  logger.info('✅ Initial migration completed successfully');
}

/**
 * Check for and run pending migrations
 */
async function checkAndRunPendingMigrations() {
  try {
    // Create migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get executed migrations
    const executedResult = await query('SELECT filename FROM migrations ORDER BY filename');
    const executedMigrations = executedResult.rows.map(row => row.filename);

    // Get all migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      logger.info('📁 No migrations directory found');
      return;
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Find pending migrations
    const pendingMigrations = migrationFiles.filter(
      file => !executedMigrations.includes(file)
    );

    if (pendingMigrations.length === 0) {
      logger.info('📋 No pending migrations found');
      return;
    }

    logger.info(`🔄 Found ${pendingMigrations.length} pending migrations`);

    // Run pending migrations
    for (const migrationFile of pendingMigrations) {
      logger.info(`⚡ Running migration: ${migrationFile}`);
      
      const migrationPath = path.join(migrationsDir, migrationFile);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      await query(migrationSQL);
      
      // Record migration as executed
      await query(
        'INSERT INTO migrations (filename) VALUES ($1)',
        [migrationFile]
      );
      
      logger.info(`✅ Migration completed: ${migrationFile}`);
    }

  } catch (error) {
    logger.error('❌ Error running migrations:', error);
    throw error;
  }
}

/**
 * Verify that critical tables exist
 */
async function verifyCriticalTables() {
  const criticalTables = ['users', 'employees', 'projects', 'assignments'];
  
  for (const tableName of criticalTables) {
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);
    
    if (!result.rows[0].exists) {
      throw new Error(`Critical table missing: ${tableName}`);
    }
  }
  
  logger.info('✅ All critical tables verified');
}

/**
 * Determine if we should fall back to demo mode
 */
function shouldFallbackToDemo(error) {
  const fallbackConditions = [
    'connection',
    'timeout',
    'ECONNREFUSED',
    'ENOTFOUND',
    'authentication failed',
    'econnrefused' // Handle case variations
  ];

  const errorMessage = error.message.toLowerCase();
  const errorCode = error.code ? error.code.toLowerCase() : '';

  return fallbackConditions.some(condition =>
    errorMessage.includes(condition) || errorCode.includes(condition)
  );
}

/**
 * Get initialization status
 */
function getInitializationStatus() {
  return {
    isInitialized,
    isInitializing: !!initializationPromise && !isInitialized
  };
}

/**
 * Reset initialization state (for testing)
 */
function resetInitialization() {
  isInitialized = false;
  initializationPromise = null;
}

module.exports = {
  initializeDatabase,
  getInitializationStatus,
  resetInitialization
};
