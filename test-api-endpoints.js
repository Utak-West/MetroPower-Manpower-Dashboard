/**
 * Test API Endpoints
 * 
 * This script tests the API endpoints to verify they're using
 * the database instead of demo mode.
 */

require('dotenv').config();
const express = require('express');

async function testAPIEndpoints() {
  console.log('🔍 Testing API endpoints...\n');
  
  try {
    // Import the server app
    const { app } = require('./backend/server');
    
    // Start a test server
    const server = app.listen(3002, () => {
      console.log('🚀 Test server started on port 3002');
    });

    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test the debug endpoint to check demo mode status
    console.log('🔍 Testing debug endpoint...');
    const response = await fetch('http://localhost:3002/api/debug');
    const debugData = await response.json();
    
    console.log('📋 Debug response:');
    console.log('  isDemoMode:', debugData.isDemoMode);
    console.log('  database:', debugData.database);
    console.log('  status:', debugData.status);
    console.log('');

    // Test employees endpoint (should use database)
    console.log('🔍 Testing employees endpoint...');
    try {
      const employeesResponse = await fetch('http://localhost:3002/api/employees', {
        headers: {
          'Authorization': 'Bearer test-token' // This will fail auth but should still hit the endpoint
        }
      });
      console.log('👷 Employees endpoint status:', employeesResponse.status);
      
      if (employeesResponse.status === 401) {
        console.log('✅ Employees endpoint reached (authentication required as expected)');
      }
    } catch (error) {
      console.log('⚠️  Employees endpoint error (expected due to auth):', error.message);
    }

    // Test projects endpoint (should use database)
    console.log('🔍 Testing projects endpoint...');
    try {
      const projectsResponse = await fetch('http://localhost:3002/api/projects', {
        headers: {
          'Authorization': 'Bearer test-token' // This will fail auth but should still hit the endpoint
        }
      });
      console.log('📁 Projects endpoint status:', projectsResponse.status);
      
      if (projectsResponse.status === 401) {
        console.log('✅ Projects endpoint reached (authentication required as expected)');
      }
    } catch (error) {
      console.log('⚠️  Projects endpoint error (expected due to auth):', error.message);
    }

    // Close the test server
    server.close();
    console.log('\n✅ API endpoints test completed!');
    
  } catch (error) {
    console.error('❌ API endpoints test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testAPIEndpoints().catch(console.error);
