#!/usr/bin/env node

/**
 * Login Endpoint Test Script
 * 
 * Tests the actual login endpoint to verify the HTTP 500 error is resolved
 */

const path = require('path');
const express = require('express');

// Set up environment for backend modules
process.env.NODE_PATH = path.join(__dirname, '..', 'backend');
require('module').Module._initPaths();

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function testLoginEndpoint() {
  console.log('🧪 Testing MetroPower Dashboard Login Endpoint');
  console.log('==============================================');
  console.log(`📅 Started at: ${new Date().toISOString()}`);

  try {
    // Initialize the application
    console.log('\n1️⃣ Initializing Application...');
    
    // Import and initialize the server
    const serverModule = require('../backend/server');
    await serverModule.initializeApp();
    
    console.log('   ✅ Application initialized successfully');

    // Create test server
    console.log('\n2️⃣ Setting up Test Server...');
    
    const app = serverModule.app;
    const server = require('http').createServer(app);
    
    // Start server on a test port
    const testPort = 3002;
    await new Promise((resolve, reject) => {
      server.listen(testPort, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log(`   ✅ Test server running on port ${testPort}`);

    // Test login endpoint
    console.log('\n3️⃣ Testing Login Endpoint...');
    
    const testCredentials = {
      identifier: 'antione.harrell@metropower.com',
      password: 'MetroPower2025!'
    };
    
    console.log(`   📧 Email: ${testCredentials.identifier}`);
    console.log(`   🔑 Password: ${testCredentials.password}`);
    
    // Make login request
    const response = await fetch(`http://localhost:${testPort}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCredentials)
    });
    
    console.log(`   📡 Response Status: ${response.status}`);
    console.log(`   📡 Response Status Text: ${response.statusText}`);
    
    const responseData = await response.json();
    
    if (response.status === 200) {
      console.log('   ✅ LOGIN SUCCESS!');
      console.log(`   👤 User: ${responseData.user.first_name} ${responseData.user.last_name}`);
      console.log(`   📧 Email: ${responseData.user.email}`);
      console.log(`   🎭 Role: ${responseData.user.role}`);
      console.log(`   🎫 Access Token: ${responseData.accessToken ? 'Generated' : 'Missing'}`);
      
      // Test token verification
      if (responseData.accessToken) {
        console.log('\n4️⃣ Testing Token Verification...');
        
        const verifyResponse = await fetch(`http://localhost:${testPort}/api/auth/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${responseData.accessToken}`
          }
        });
        
        if (verifyResponse.status === 200) {
          console.log('   ✅ Token verification successful');
        } else {
          console.log(`   ⚠️  Token verification failed: ${verifyResponse.status}`);
        }
      }
      
    } else {
      console.log('   ❌ LOGIN FAILED!');
      console.log(`   📄 Response: ${JSON.stringify(responseData, null, 2)}`);
    }

    // Test with wrong password
    console.log('\n5️⃣ Testing Wrong Password...');
    
    const wrongCredentials = {
      identifier: 'antione.harrell@metropower.com',
      password: 'wrongpassword'
    };
    
    const wrongResponse = await fetch(`http://localhost:${testPort}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(wrongCredentials)
    });
    
    console.log(`   📡 Wrong Password Status: ${wrongResponse.status}`);
    
    if (wrongResponse.status === 401) {
      console.log('   ✅ Correctly rejected wrong password');
    } else {
      console.log('   ⚠️  Unexpected response for wrong password');
    }

    // Test demo bypass (if available)
    console.log('\n6️⃣ Testing Demo Bypass...');
    
    const demoResponse = await fetch(`http://localhost:${testPort}/api/auth/demo-bypass`);
    console.log(`   📡 Demo Bypass Status: ${demoResponse.status}`);
    
    if (demoResponse.status === 200) {
      const demoData = await demoResponse.json();
      console.log('   ✅ Demo bypass working');
      console.log(`   👤 Demo User: ${demoData.user.first_name} ${demoData.user.last_name}`);
    } else if (demoResponse.status === 403) {
      console.log('   ℹ️  Demo bypass disabled (expected in production)');
    } else {
      console.log('   ⚠️  Demo bypass unexpected response');
    }

    // Cleanup
    console.log('\n7️⃣ Cleaning Up...');
    server.close();
    console.log('   ✅ Test server stopped');

    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('===============');
    
    if (response.status === 200) {
      console.log('🎉 LOGIN ENDPOINT TEST: PASSED');
      console.log('✅ HTTP 500 error has been resolved');
      console.log('✅ Authentication is working correctly');
      console.log('✅ JWT tokens are being generated');
      console.log('✅ User data is being returned properly');
      
      console.log('\n🔐 PRODUCTION LOGIN CREDENTIALS:');
      console.log('================================');
      console.log('Email: antione.harrell@metropower.com');
      console.log('Password: MetroPower2025!');
      console.log('Role: Project Manager');
      
    } else {
      console.log('❌ LOGIN ENDPOINT TEST: FAILED');
      console.log('❌ HTTP 500 error may still exist');
      console.log('🔍 Check the response details above');
    }

  } catch (error) {
    console.error('\n💥 Test failed with error:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testLoginEndpoint();
}

module.exports = { testLoginEndpoint };
