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
    // Check if we have database configuration
    if (!process.env.DB_HOST) {
      console.error('❌ No database configuration found in environment variables.');
      console.error('   Required environment variables: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
      console.error('   Please set up your database environment variables in Vercel.');
      process.exit(1);
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

    // Always fail the build for database issues since we've removed demo mode
    if (error.message.includes('database') || error.message.includes('connection')) {
      console.error('❌ Database connection failed. A working database connection is required.');
      console.error('   Please verify your database configuration in Vercel environment variables.');
      process.exit(1);
    } else {
      process.exit(1);
    }
  }
}

// Run the build process
if (require.main === module) {
  runBuild();
}

module.exports = { runBuild };
