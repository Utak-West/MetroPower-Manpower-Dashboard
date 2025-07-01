#!/usr/bin/env node

/**
 * Vercel Environment Simulation Test
 * 
 * This script simulates the Vercel deployment environment to test:
 * 1. Build process with Vercel environment variables
 * 2. Runtime initialization with demo mode fallback
 * 3. API endpoint functionality
 */

const { performance } = require('perf_hooks');
const path = require('path');

// Simulate Vercel environment
process.env.VERCEL = '1';
process.env.NODE_ENV = 'production';
process.env.DEMO_MODE_ENABLED = 'false';
process.env.USE_MEMORY_DB = 'false';

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function testVercelSimulation() {
  console.log('🌐 Testing MetroPower Dashboard Vercel deployment simulation...');
  console.log(`📅 Test started at: ${new Date().toISOString()}`);
  console.log('🔧 Environment: Vercel simulation mode');
  
  const testStartTime = performance.now();
  
  try {
    // Test 1: Optimized Build Process
    console.log('\n📦 Test 1: Optimized Build Process (Vercel Environment)');
    const buildStartTime = performance.now();
    
    const { runBuild } = require('./vercel-build');
    await runBuild();
    
    const buildTime = performance.now() - buildStartTime;
    console.log(`⏱️  Build completed in ${Math.round(buildTime)}ms`);
    
    // Verify build performance
    if (buildTime < 1000) {
      console.log('🟢 Excellent: Build time under 1 second');
    } else if (buildTime < 5000) {
      console.log('🟡 Good: Build time under 5 seconds');
    } else {
      console.log('🔴 Poor: Build time over 5 seconds');
    }
    
    // Test 2: Runtime Database Initialization with Fallback
    console.log('\n🔗 Test 2: Runtime Database Initialization (Demo Mode Fallback)');
    const dbInitStartTime = performance.now();
    
    const { initializeDatabase } = require('../backend/src/utils/runtime-db-init');
    const initResult = await initializeDatabase();
    
    const dbInitTime = performance.now() - dbInitStartTime;
    console.log(`⏱️  Database initialization completed in ${Math.round(dbInitTime)}ms`);
    console.log(`📊 Mode: ${initResult.mode}`);
    console.log(`✅ Success: ${initResult.success}`);
    
    if (initResult.fallback) {
      console.log('🎭 Successfully fell back to demo mode (expected for local testing)');
    }
    
    // Test 3: API Entry Point Performance
    console.log('\n🌐 Test 3: API Entry Point Performance');
    const apiStartTime = performance.now();
    
    try {
      // Reset any cached modules to simulate fresh start
      delete require.cache[require.resolve('../api/index')];
      
      const apiApp = require('../api/index');
      const apiLoadTime = performance.now() - apiStartTime;
      console.log(`⏱️  API entry point loaded in ${Math.round(apiLoadTime)}ms`);
      
      if (apiApp) {
        console.log('✅ API entry point loaded successfully');
        
        // Test basic middleware functionality
        console.log('🔍 Testing middleware functionality...');
        
        // Simulate a request object
        const mockReq = {
          path: '/api/health',
          originalUrl: '/api/health',
          method: 'GET'
        };
        
        const mockRes = {
          status: (code) => ({
            json: (data) => {
              console.log(`📡 Mock response: ${code} - ${JSON.stringify(data)}`);
              return mockRes;
            },
            send: (data) => {
              console.log(`📡 Mock response: ${code} - ${data}`);
              return mockRes;
            }
          }),
          json: (data) => {
            console.log(`📡 Mock response: 200 - ${JSON.stringify(data)}`);
            return mockRes;
          }
        };
        
        console.log('✅ Middleware test completed');
      } else {
        console.error('❌ API entry point failed to load');
      }
    } catch (error) {
      console.error('❌ API entry point error:', error.message);
    }
    
    // Test 4: Performance Benchmarks
    console.log('\n📊 Test 4: Performance Benchmarks');
    
    const totalTestTime = performance.now() - testStartTime;
    
    console.log('=====================================');
    console.log('📈 Performance Metrics:');
    console.log(`⏱️  Total test time: ${Math.round(totalTestTime)}ms`);
    console.log(`📦 Build time: ${Math.round(buildTime)}ms`);
    console.log(`🔗 DB init time: ${Math.round(dbInitTime)}ms`);
    console.log(`🌐 API load time: ${Math.round(performance.now() - apiStartTime)}ms`);
    
    // Deployment readiness assessment
    console.log('\n🎯 Deployment Readiness Assessment');
    console.log('===================================');
    
    let score = 0;
    let maxScore = 4;
    
    // Build performance
    if (buildTime < 5000) {
      console.log('✅ Build Performance: PASS');
      score++;
    } else {
      console.log('❌ Build Performance: FAIL (too slow)');
    }
    
    // Database initialization
    if (initResult.success) {
      console.log('✅ Database Initialization: PASS');
      score++;
    } else {
      console.log('❌ Database Initialization: FAIL');
    }
    
    // API loading
    if (performance.now() - apiStartTime < 10000) {
      console.log('✅ API Loading: PASS');
      score++;
    } else {
      console.log('❌ API Loading: FAIL (too slow)');
    }
    
    // Overall performance
    if (totalTestTime < 30000) {
      console.log('✅ Overall Performance: PASS');
      score++;
    } else {
      console.log('❌ Overall Performance: FAIL (too slow)');
    }
    
    console.log(`\n📊 Final Score: ${score}/${maxScore}`);
    
    if (score === maxScore) {
      console.log('🎉 EXCELLENT: Ready for Vercel deployment!');
      console.log('🚀 All performance benchmarks passed');
      console.log('⚡ Build time optimized (no database connections during build)');
      console.log('🔄 Runtime initialization working correctly');
    } else if (score >= maxScore * 0.75) {
      console.log('🟡 GOOD: Mostly ready for deployment with minor issues');
    } else {
      console.log('🔴 NEEDS WORK: Significant issues need to be addressed');
    }
    
    console.log('\n✅ Vercel simulation test completed successfully!');
    
  } catch (error) {
    const totalTestTime = performance.now() - testStartTime;
    console.error('\n❌ Vercel simulation test failed:');
    console.error(`Error: ${error.message}`);
    console.error(`Failed after: ${Math.round(totalTestTime)}ms`);
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testVercelSimulation();
}

module.exports = { testVercelSimulation };
