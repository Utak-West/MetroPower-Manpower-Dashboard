/**
 * Database Migration Runner
 * 
 * Handles running database migrations for the MetroPower Dashboard.
 * Supports both up and down migrations with proper tracking.
 */

const fs = require('fs').promises;
const path = require('path');
const { query, connectDatabase } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Create migrations tracking table if it doesn't exist
 */
const createMigrationsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await query(createTableQuery);
  logger.info('Migrations table created or verified');
};

/**
 * Get list of executed migrations
 */
const getExecutedMigrations = async () => {
  try {
    const result = await query('SELECT filename FROM migrations ORDER BY id');
    return result.rows.map(row => row.filename);
  } catch (error) {
    logger.error('Error getting executed migrations:', error);
    return [];
  }
};

/**
 * Mark migration as executed
 */
const markMigrationExecuted = async (filename) => {
  await query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
  logger.info(`Migration marked as executed: ${filename}`);
};

/**
 * Remove migration from executed list
 */
const unmarkMigrationExecuted = async (filename) => {
  await query('DELETE FROM migrations WHERE filename = $1', [filename]);
  logger.info(`Migration unmarked: ${filename}`);
};

/**
 * Get all migration files from the migrations directory
 */
const getMigrationFiles = async () => {
  const migrationsDir = __dirname;
  const files = await fs.readdir(migrationsDir);
  
  return files
    .filter(file => file.endsWith('.sql') && file !== 'migrate.js')
    .sort();
};

/**
 * Execute a single migration file
 */
const executeMigration = async (filename) => {
  const filePath = path.join(__dirname, filename);
  const migrationSQL = await fs.readFile(filePath, 'utf8');
  
  // Split by semicolon and execute each statement
  const statements = migrationSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
  
  logger.info(`Executing migration: ${filename}`);
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await query(statement);
      } catch (error) {
        logger.error(`Error executing statement in ${filename}:`, error);
        logger.error('Statement:', statement);
        throw error;
      }
    }
  }
  
  await markMigrationExecuted(filename);
  logger.info(`Migration completed: ${filename}`);
};

/**
 * Run all pending migrations
 */
const runMigrations = async () => {
  try {
    logger.info('Starting database migrations...');
    
    // Connect to database
    await connectDatabase();
    
    // Create migrations table
    await createMigrationsTable();
    
    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();
    logger.info(`Found ${executedMigrations.length} executed migrations`);
    
    // Get all migration files
    const migrationFiles = await getMigrationFiles();
    logger.info(`Found ${migrationFiles.length} migration files`);
    
    // Find pending migrations
    const pendingMigrations = migrationFiles.filter(
      file => !executedMigrations.includes(file)
    );
    
    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations found');
      return;
    }
    
    logger.info(`Found ${pendingMigrations.length} pending migrations:`, pendingMigrations);
    
    // Execute pending migrations
    for (const migration of pendingMigrations) {
      await executeMigration(migration);
    }
    
    logger.info('All migrations completed successfully');
    
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
};

/**
 * Rollback the last migration
 */
const rollbackLastMigration = async () => {
  try {
    logger.info('Rolling back last migration...');
    
    await connectDatabase();
    await createMigrationsTable();
    
    // Get the last executed migration
    const result = await query(
      'SELECT filename FROM migrations ORDER BY id DESC LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }
    
    const lastMigration = result.rows[0].filename;
    logger.info(`Rolling back migration: ${lastMigration}`);
    
    // Check if rollback file exists
    const rollbackFile = lastMigration.replace('.sql', '_rollback.sql');
    const rollbackPath = path.join(__dirname, rollbackFile);
    
    try {
      const rollbackSQL = await fs.readFile(rollbackPath, 'utf8');
      
      // Execute rollback statements
      const statements = rollbackSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          await query(statement);
        }
      }
      
      // Remove from migrations table
      await unmarkMigrationExecuted(lastMigration);
      
      logger.info(`Rollback completed: ${lastMigration}`);
      
    } catch (fileError) {
      logger.warn(`No rollback file found for ${lastMigration}, manual rollback required`);
    }
    
  } catch (error) {
    logger.error('Rollback failed:', error);
    process.exit(1);
  }
};

/**
 * Show migration status
 */
const showMigrationStatus = async () => {
  try {
    await connectDatabase();
    await createMigrationsTable();
    
    const executedMigrations = await getExecutedMigrations();
    const migrationFiles = await getMigrationFiles();
    
    console.log('\n=== Migration Status ===');
    console.log(`Total migration files: ${migrationFiles.length}`);
    console.log(`Executed migrations: ${executedMigrations.length}`);
    console.log(`Pending migrations: ${migrationFiles.length - executedMigrations.length}`);
    
    console.log('\n=== Migration Files ===');
    migrationFiles.forEach(file => {
      const status = executedMigrations.includes(file) ? '✓ EXECUTED' : '✗ PENDING';
      console.log(`${status} - ${file}`);
    });
    
  } catch (error) {
    logger.error('Error showing migration status:', error);
    process.exit(1);
  }
};

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'up':
    case 'migrate':
      runMigrations();
      break;
    case 'down':
    case 'rollback':
      rollbackLastMigration();
      break;
    case 'status':
      showMigrationStatus();
      break;
    default:
      console.log('Usage: node migrate.js [up|down|status]');
      console.log('  up/migrate - Run pending migrations');
      console.log('  down/rollback - Rollback last migration');
      console.log('  status - Show migration status');
      process.exit(1);
  }
}

module.exports = {
  runMigrations,
  rollbackLastMigration,
  showMigrationStatus
};
