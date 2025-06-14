#!/usr/bin/env node

/**
 * Vercel Build Script
 * 
 * This script runs during Vercel deployment to set up the database
 * and perform any necessary initialization tasks.
 */

const path = require('path');
const fs = require('fs');

// Set up environment
process.env.NODE_PATH = (process.env.NODE_PATH ? process.env.NODE_PATH + path.delimiter : '') + path.join(__dirname, '..', 'backend'); // More robust NODE_PATH append
require('module').Module._initPaths();

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function runBuild() {
  const buildStartTime = Date.now();
  console.log('🚀 Starting Vercel build process...');
  console.log(`📅 Build started at: ${new Date().toISOString()}`);

  try {
    // Check if demo mode is enabled
    if (process.env.DEMO_MODE_ENABLED === 'true' || process.env.USE_MEMORY_DB === 'true') {
      console.log('🎭 Demo mode enabled - skipping database setup');
      console.log('✅ Build completed successfully in demo mode');
      console.log('🎉 Application will use in-memory data for demonstration');
      return;
    }

    // Check if we have database configuration
    if (!process.env.DB_HOST) {
      console.log('⚠️  No database configuration found in environment variables.');
      console.log('   Falling back to demo mode with in-memory data.');
      console.log('   To use a real database, set: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
      console.log('✅ Build completed successfully in demo mode');
      return;
    }

    console.log('�️  Setting up database connection...');

    // Import database utilities with error handling
    let connectDatabase, query;
    try {
      const dbModule = require('../backend/src/config/database');
      connectDatabase = dbModule.connectDatabase;
      query = dbModule.query;
    } catch (importError) {
      console.error('❌ Failed to import database utilities:', importError.message);
      throw new Error(`Database module import failed: ${importError.message}`);
    }

    // Test database connection with timeout
    console.log('� Attempting database connection...');
    const connectionTimeout = setTimeout(() => {
      throw new Error('Database connection timeout after 30 seconds');
    }, 30000);

    await connectDatabase();
    clearTimeout(connectionTimeout);
    console.log('✅ Database connection established');

    // Check if tables exist
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    if (tablesResult.rows.length === 0) {
      console.log('🔧 No tables found. Running initial migration...');

      // Read and execute migration file
      const migrationPath = path.join(__dirname, '..', 'backend', 'src', 'migrations', '001_create_tables.sql');

      if (fs.existsSync(migrationPath)) {
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        await query(migrationSQL);
        console.log('✅ Database tables created successfully');
      } else {
        console.log('⚠️  Migration file not found. Please run migrations manually.');
      }
    } else {
      console.log('✅ Database tables already exist');
    }

    console.log('🎉 Build process completed successfully!');

  } catch (error) {
    console.error('❌ Build process failed:', error.message);

    // If database connection fails, fall back to demo mode
    if (error.message.includes('database') || error.message.includes('connection') || error.code === 'ECONNREFUSED') {
      console.log('⚠️  Database connection failed, falling back to demo mode');
      console.log('✅ Build completed successfully in demo mode');
      console.log('🎭 Application will use in-memory data for demonstration');
      return; // Don't exit with error, continue with demo mode
    } else {
      console.error('❌ Build failed with non-database error');
      process.exit(1);
    }
  }
}

// Run the build process
if (require.main === module) {
  runBuild();
}

module.exports = { runBuild };
