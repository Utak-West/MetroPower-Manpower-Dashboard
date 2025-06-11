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
process.env.NODE_PATH = path.join(__dirname, '..', 'backend');
require('module').Module._initPaths();

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function runBuild() {
  console.log('🚀 Starting Vercel build process...');
  
  try {
    // Check if we have database configuration
    if (!process.env.DB_HOST) {
      console.log('⚠️  No database configuration found. Skipping database setup.');
      console.log('   Make sure to set up your database environment variables in Vercel.');
      return;
    }

    console.log('📦 Installing backend dependencies...');
    const { execSync } = require('child_process');
    
    // Install backend dependencies
    execSync('npm install', { 
      cwd: path.join(__dirname, '..', 'backend'),
      stdio: 'inherit'
    });

    console.log('🗄️  Setting up database connection...');
    
    // Import database utilities
    const { connectDatabase, query } = require('../backend/src/config/database');
    
    // Test database connection
    await connectDatabase();
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
    
    // Don't fail the build for database issues in case it's a temporary problem
    if (error.message.includes('database') || error.message.includes('connection')) {
      console.log('⚠️  Database setup failed, but continuing with build...');
      console.log('   Please check your database configuration and run migrations manually.');
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
