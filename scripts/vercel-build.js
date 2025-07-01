#!/usr/bin/env node

/**
 * Optimized Vercel Build Script
 *
 * This script runs during Vercel deployment and focuses only on build-time tasks.
 * Database initialization is moved to runtime to prevent build timeouts.
 */

const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function runBuild() {
  const buildStartTime = Date.now();
  console.log('🚀 Starting optimized Vercel build process...');
  console.log(`📅 Build started at: ${new Date().toISOString()}`);

  try {
    // Validate build environment
    console.log('🔍 Validating build environment...');

    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`📦 Node.js version: ${nodeVersion}`);

    // Verify required directories exist
    const requiredDirs = [
      path.join(__dirname, '..', 'backend'),
      path.join(__dirname, '..', 'frontend'),
      path.join(__dirname, '..', 'api')
    ];

    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        throw new Error(`Required directory not found: ${dir}`);
      }
      console.log(`✅ Directory verified: ${path.basename(dir)}`);
    }

    // Verify critical files exist
    const criticalFiles = [
      path.join(__dirname, '..', 'backend', 'server.js'),
      path.join(__dirname, '..', 'api', 'index.js'),
      path.join(__dirname, '..', 'vercel.json')
    ];

    for (const file of criticalFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Critical file not found: ${file}`);
      }
      console.log(`✅ File verified: ${path.basename(file)}`);
    }

    // Check if database migration files exist (for runtime initialization)
    const migrationDir = path.join(__dirname, '..', 'backend', 'src', 'migrations');
    if (fs.existsSync(migrationDir)) {
      const migrationFiles = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql'));
      console.log(`📋 Found ${migrationFiles.length} migration files for runtime initialization`);
    } else {
      console.log('⚠️  No migration directory found - database will use default schema');
    }

    // Log environment configuration (without sensitive data)
    console.log('🔧 Environment configuration:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`   DEMO_MODE_ENABLED: ${process.env.DEMO_MODE_ENABLED || 'false'}`);
    console.log(`   USE_MEMORY_DB: ${process.env.USE_MEMORY_DB || 'false'}`);
    console.log(`   Database configured: ${process.env.POSTGRES_URL ? 'Yes (Vercel Postgres)' : process.env.DB_HOST ? 'Yes (Custom)' : 'No'}`);

    const buildTime = Date.now() - buildStartTime;
    console.log(`⚡ Build validation completed in ${buildTime}ms`);
    console.log('✅ Build process completed successfully!');
    console.log('🎯 Database initialization will occur at runtime');
    console.log(`📊 Total build time: ${buildTime}ms`);

  } catch (error) {
    const buildTime = Date.now() - buildStartTime;
    console.error('❌ Build process failed:', error.message);
    console.error(`⏱️  Failed after ${buildTime}ms`);

    // Don't fail the build for non-critical errors
    if (error.message.includes('migration') || error.message.includes('database')) {
      console.log('⚠️  Database-related error detected, but build can continue');
      console.log('🎭 Application will handle database initialization at runtime');
      return;
    }

    // Only exit with error for critical build failures
    console.error('❌ Critical build error - deployment cannot continue');
    process.exit(1);
  }
}

// Run the build process
if (require.main === module) {
  runBuild();
}

module.exports = { runBuild };
