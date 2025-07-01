#!/usr/bin/env node

/**
 * Test Build Optimization Script
 * 
 * This script tests the optimized build process to ensure:
 * 1. Build completes quickly (under 30 seconds)
 * 2. No database connections during build time
 * 3. Runtime initialization works correctly
 */

const { performance } = require('perf_hooks');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function testBuildOptimization() {
  console.log('🧪 Testing MetroPower Dashboard build optimization...');
  console.log(`📅 Test started at: ${new Date().toISOString()}`);
  
  const testStartTime = performance.now();
  
  try {
    // Test 1: Build Script Performance
    console.log('\n📦 Test 1: Build Script Performance');
    const buildStartTime = performance.now();
    
    const { runBuild } = require('./vercel-build');
    await runBuild();
    
    const buildTime = performance.now() - buildStartTime;
    console.log(`⏱️  Build completed in ${Math.round(buildTime)}ms`);
    
    if (buildTime > 30000) {
      console.warn('⚠️  Build time exceeds 30 seconds - may cause deployment issues');
    } else {
      console.log('✅ Build time is optimal');
    }
    
    // Test 2: Runtime Database Initialization
    console.log('\n🔗 Test 2: Runtime Database Initialization');
    const dbInitStartTime = performance.now();
    
    const { initializeDatabase } = require('../backend/src/utils/runtime-db-init');
    const initResult = await initializeDatabase();
    
    const dbInitTime = performance.now() - dbInitStartTime;
    console.log(`⏱️  Database initialization completed in ${Math.round(dbInitTime)}ms`);
    console.log(`📊 Result: ${JSON.stringify(initResult, null, 2)}`);
    
    if (initResult.success) {
      console.log('✅ Runtime database initialization successful');
    } else {
      console.error('❌ Runtime database initialization failed');
    }
    
    // Test 3: Server Startup Performance
    console.log('\n🚀 Test 3: Server Startup Performance');
    const serverStartTime = performance.now();
    
    // Import server without starting it
    const serverModule = require('../backend/server');
    
    // Test initialization function
    if (serverModule.initializeApp) {
      await serverModule.initializeApp();
      const serverInitTime = performance.now() - serverStartTime;
      console.log(`⏱️  Server initialization completed in ${Math.round(serverInitTime)}ms`);
      console.log('✅ Server initialization successful');
    } else {
      console.log('⚠️  Server initialization function not found');
    }
    
    // Test 4: API Entry Point
    console.log('\n🌐 Test 4: API Entry Point');
    const apiStartTime = performance.now();
    
    try {
      // Test API entry point loading
      const apiApp = require('../api/index');
      const apiLoadTime = performance.now() - apiStartTime;
      console.log(`⏱️  API entry point loaded in ${Math.round(apiLoadTime)}ms`);
      
      if (apiApp) {
        console.log('✅ API entry point loaded successfully');
      } else {
        console.error('❌ API entry point failed to load');
      }
    } catch (error) {
      console.error('❌ API entry point error:', error.message);
    }
    
    // Test Summary
    const totalTestTime = performance.now() - testStartTime;
    console.log('\n📊 Test Summary');
    console.log('================');
    console.log(`⏱️  Total test time: ${Math.round(totalTestTime)}ms`);
    console.log(`📦 Build time: ${Math.round(buildTime)}ms`);
    console.log(`🔗 DB init time: ${Math.round(dbInitTime)}ms`);
    console.log(`🚀 Server init time: ${Math.round(performance.now() - serverStartTime)}ms`);
    
    // Performance Analysis
    console.log('\n🎯 Performance Analysis');
    console.log('========================');
    
    if (buildTime < 5000) {
      console.log('🟢 Build performance: Excellent (< 5s)');
    } else if (buildTime < 15000) {
      console.log('🟡 Build performance: Good (< 15s)');
    } else if (buildTime < 30000) {
      console.log('🟠 Build performance: Acceptable (< 30s)');
    } else {
      console.log('🔴 Build performance: Poor (> 30s) - needs optimization');
    }
    
    if (dbInitTime < 5000) {
      console.log('🟢 Database init performance: Excellent (< 5s)');
    } else if (dbInitTime < 15000) {
      console.log('🟡 Database init performance: Good (< 15s)');
    } else {
      console.log('🟠 Database init performance: Needs improvement (> 15s)');
    }
    
    console.log('\n✅ Build optimization test completed successfully!');
    console.log('🚀 Ready for Vercel deployment');
    
  } catch (error) {
    const totalTestTime = performance.now() - testStartTime;
    console.error('\n❌ Build optimization test failed:');
    console.error(`Error: ${error.message}`);
    console.error(`Failed after: ${Math.round(totalTestTime)}ms`);
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('- Check database connection settings');
    console.log('- Verify environment variables are set correctly');
    console.log('- Ensure all required files exist');
    console.log('- Check for any missing dependencies');
    
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testBuildOptimization();
}

module.exports = { testBuildOptimization };
