#!/usr/bin/env node

/**
 * Login Error Diagnostic Script
 * 
 * This script diagnoses the HTTP 500 login error by testing each component
 * of the authentication system to identify the root cause.
 */

const path = require('path');

// Set up environment for backend modules
process.env.NODE_PATH = path.join(__dirname, '..', 'backend');
require('module').Module._initPaths();

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function diagnosisLoginError() {
  console.log('🔍 MetroPower Dashboard - Login Error Diagnosis');
  console.log('==============================================');
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  
  const results = {
    environment: {},
    database: {},
    jwt: {},
    demoService: {},
    authentication: {},
    errors: []
  };

  try {
    // Test 1: Environment Configuration
    console.log('\n1️⃣ Testing Environment Configuration...');
    
    results.environment = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      DEMO_MODE_ENABLED: process.env.DEMO_MODE_ENABLED,
      USE_MEMORY_DB: process.env.USE_MEMORY_DB,
      JWT_SECRET_LENGTH: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
      JWT_REFRESH_SECRET_LENGTH: process.env.JWT_REFRESH_SECRET ? process.env.JWT_REFRESH_SECRET.length : 0,
      POSTGRES_URL_SET: !!process.env.POSTGRES_URL,
      DB_HOST_SET: !!process.env.DB_HOST
    };
    
    console.log(`   NODE_ENV: ${results.environment.NODE_ENV}`);
    console.log(`   JWT Secret Length: ${results.environment.JWT_SECRET_LENGTH}`);
    console.log(`   JWT Refresh Secret Length: ${results.environment.JWT_REFRESH_SECRET_LENGTH}`);
    
    if (results.environment.JWT_SECRET_LENGTH < 32) {
      results.errors.push('JWT_SECRET is too short (should be 32+ characters)');
    }
    
    if (results.environment.JWT_REFRESH_SECRET_LENGTH < 32) {
      results.errors.push('JWT_REFRESH_SECRET is too short (should be 32+ characters)');
    }

    // Test 2: Database Initialization
    console.log('\n2️⃣ Testing Database Initialization...');
    
    try {
      const { initializeDatabase } = require('../backend/src/utils/runtime-db-init');
      const dbResult = await initializeDatabase();
      
      results.database = {
        success: dbResult.success,
        mode: dbResult.mode,
        fallback: dbResult.fallback,
        initTime: dbResult.initTime
      };
      
      console.log(`   Database Mode: ${dbResult.mode}`);
      console.log(`   Success: ${dbResult.success}`);
      
      if (dbResult.fallback) {
        console.log(`   ⚠️  Fell back to demo mode`);
      }
      
    } catch (error) {
      results.database.error = error.message;
      results.errors.push(`Database initialization failed: ${error.message}`);
      console.log(`   ❌ Database Error: ${error.message}`);
    }

    // Test 3: JWT Configuration
    console.log('\n3️⃣ Testing JWT Configuration...');
    
    try {
      const config = require('../backend/src/config/app');
      const jwt = require('jsonwebtoken');
      
      results.jwt = {
        secret_configured: !!config.jwt.secret,
        refresh_secret_configured: !!config.jwt.refreshSecret,
        expires_in: config.jwt.expiresIn,
        refresh_expires_in: config.jwt.refreshExpiresIn,
        issuer: config.jwt.issuer
      };
      
      // Test JWT token generation
      const testPayload = { user_id: 1, username: 'test', type: 'access' };
      const testToken = jwt.sign(testPayload, config.jwt.secret, { expiresIn: '1h' });
      const decoded = jwt.verify(testToken, config.jwt.secret);
      
      results.jwt.token_generation_test = 'PASS';
      console.log(`   ✅ JWT Configuration: Valid`);
      console.log(`   ✅ Token Generation: Working`);
      
    } catch (error) {
      results.jwt.error = error.message;
      results.errors.push(`JWT configuration error: ${error.message}`);
      console.log(`   ❌ JWT Error: ${error.message}`);
    }

    // Test 4: Demo Service
    console.log('\n4️⃣ Testing Demo Service...');
    
    try {
      const demoService = require('../backend/src/services/demoService');
      
      // Initialize demo data if needed
      await demoService.initializeDemoData();
      
      // Test user lookup
      const testUser = await demoService.findUserByIdentifier('antione.harrell@metropower.com');
      const adminUser = await demoService.findUserByIdentifier('admin@metropower.com');
      
      results.demoService = {
        manager_user_found: !!testUser,
        admin_user_found: !!adminUser,
        manager_user_active: testUser ? testUser.is_active : false,
        admin_user_active: adminUser ? adminUser.is_active : false
      };
      
      if (testUser) {
        console.log(`   ✅ Manager User Found: ${testUser.email}`);
        console.log(`   ✅ Manager User Active: ${testUser.is_active}`);
      } else {
        console.log(`   ❌ Manager User Not Found`);
        results.errors.push('Manager user antione.harrell@metropower.com not found');
      }
      
      if (adminUser) {
        console.log(`   ✅ Admin User Found: ${adminUser.email}`);
      } else {
        console.log(`   ❌ Admin User Not Found`);
        results.errors.push('Admin user not found');
      }
      
    } catch (error) {
      results.demoService.error = error.message;
      results.errors.push(`Demo service error: ${error.message}`);
      console.log(`   ❌ Demo Service Error: ${error.message}`);
    }

    // Test 5: Authentication Flow
    console.log('\n5️⃣ Testing Authentication Flow...');
    
    try {
      const User = require('../backend/src/models/User');
      const bcrypt = require('bcryptjs');
      
      // Test password verification
      const testPassword = 'MetroPower2025!';
      const testHash = await bcrypt.hash(testPassword, 12);
      const passwordValid = await bcrypt.compare(testPassword, testHash);
      
      results.authentication = {
        password_hashing_test: passwordValid ? 'PASS' : 'FAIL',
        user_model_loaded: true
      };
      
      console.log(`   ✅ Password Hashing: ${passwordValid ? 'Working' : 'Failed'}`);
      
      // Test authentication with demo user
      try {
        const authResult = await User.authenticate('antione.harrell@metropower.com', 'MetroPower2025!');
        
        if (authResult) {
          results.authentication.demo_auth_test = 'PASS';
          results.authentication.tokens_generated = !!(authResult.tokens && authResult.tokens.accessToken);
          console.log(`   ✅ Demo Authentication: Working`);
          console.log(`   ✅ Token Generation: ${authResult.tokens ? 'Working' : 'Failed'}`);
        } else {
          results.authentication.demo_auth_test = 'FAIL';
          console.log(`   ❌ Demo Authentication: Failed`);
          results.errors.push('Demo authentication failed - check password or user data');
        }
      } catch (authError) {
        results.authentication.demo_auth_error = authError.message;
        console.log(`   ❌ Authentication Error: ${authError.message}`);
        results.errors.push(`Authentication error: ${authError.message}`);
      }
      
    } catch (error) {
      results.authentication.error = error.message;
      results.errors.push(`Authentication flow error: ${error.message}`);
      console.log(`   ❌ Authentication Flow Error: ${error.message}`);
    }

    // Test 6: API Route Testing
    console.log('\n6️⃣ Testing API Route Configuration...');
    
    try {
      const express = require('express');
      const authRoutes = require('../backend/src/routes/auth');
      
      results.api = {
        auth_routes_loaded: true,
        express_working: true
      };
      
      console.log(`   ✅ Auth Routes: Loaded`);
      console.log(`   ✅ Express: Working`);
      
    } catch (error) {
      results.api = { error: error.message };
      results.errors.push(`API route error: ${error.message}`);
      console.log(`   ❌ API Route Error: ${error.message}`);
    }

    // Summary
    console.log('\n📊 DIAGNOSIS SUMMARY');
    console.log('===================');
    
    if (results.errors.length === 0) {
      console.log('🎉 No critical errors found!');
      console.log('💡 The login system appears to be configured correctly.');
      console.log('🔍 The HTTP 500 error might be caused by:');
      console.log('   - Network connectivity issues');
      console.log('   - Vercel function timeout');
      console.log('   - Missing environment variables in production');
      console.log('   - Database connection issues in production');
    } else {
      console.log(`❌ Found ${results.errors.length} critical error(s):`);
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    
    if (results.environment.JWT_SECRET_LENGTH < 32) {
      console.log('   1. Set a secure JWT_SECRET (32+ characters) in Vercel environment variables');
    }
    
    if (results.environment.JWT_REFRESH_SECRET_LENGTH < 32) {
      console.log('   2. Set a secure JWT_REFRESH_SECRET (32+ characters) in Vercel environment variables');
    }
    
    if (!results.demoService.manager_user_found) {
      console.log('   3. Ensure demo data initialization is working correctly');
    }
    
    if (results.database.mode === 'demo' && results.database.fallback) {
      console.log('   4. Check database connection in production environment');
    }
    
    console.log('   5. Check Vercel function logs for detailed error messages');
    console.log('   6. Test the /api/debug endpoint for production diagnostics');
    
    console.log('\n📋 Full Results:');
    console.log(JSON.stringify(results, null, 2));
    
  } catch (error) {
    console.error('\n💥 Diagnosis script failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run diagnosis if this script is executed directly
if (require.main === module) {
  diagnosisLoginError();
}

module.exports = { diagnosisLoginError };
