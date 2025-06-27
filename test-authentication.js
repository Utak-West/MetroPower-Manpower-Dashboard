#!/usr/bin/env node

/**
 * Authentication Test Script
 * 
 * Tests the MetroPower Dashboard authentication system to ensure
 * Antoine Harrell can successfully log in and access the dashboard.
 */

const https = require('https');
const http = require('http');

// Test configuration
const LOCAL_BASE_URL = 'http://localhost:3001';
const VERCEL_BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;

// Test credentials
const TEST_CREDENTIALS = [
  {
    name: 'Antoine Harrell (Manager)',
    identifier: 'antione.harrell@metropower.com',
    password: 'password123',
    expectedRole: 'Project Manager'
  },
  {
    name: 'Admin User',
    identifier: 'admin@metropower.com',
    password: 'MetroPower2025!',
    expectedRole: 'Admin'
  }
];

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ statusCode: res.statusCode, data: jsonData, headers: res.headers });
        } catch (error) {
          resolve({ statusCode: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Test authentication endpoint
 */
async function testAuthentication(baseUrl, credentials) {
  console.log(`\n🔐 Testing authentication for ${credentials.name}...`);
  
  try {
    const response = await makeRequest(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: credentials.identifier,
        password: credentials.password
      })
    });
    
    if (response.statusCode === 200) {
      const { user, accessToken } = response.data;
      
      if (user && user.role === credentials.expectedRole) {
        console.log(`✅ Authentication successful for ${credentials.name}`);
        console.log(`   - User ID: ${user.user_id}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Role: ${user.role}`);
        console.log(`   - Token length: ${accessToken ? accessToken.length : 0} chars`);
        return { success: true, token: accessToken, user };
      } else {
        console.log(`❌ Authentication failed: Unexpected user data`);
        console.log(`   - Expected role: ${credentials.expectedRole}`);
        console.log(`   - Actual role: ${user?.role || 'undefined'}`);
        return { success: false, error: 'Role mismatch' };
      }
    } else {
      console.log(`❌ Authentication failed: HTTP ${response.statusCode}`);
      console.log(`   - Error: ${response.data.error || response.data.message || 'Unknown error'}`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log(`❌ Authentication failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test dashboard access
 */
async function testDashboardAccess(baseUrl, token) {
  console.log(`\n📊 Testing dashboard access...`);
  
  try {
    const response = await makeRequest(`${baseUrl}/api/dashboard/current`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200) {
      console.log(`✅ Dashboard access successful`);
      console.log(`   - Data keys: ${Object.keys(response.data.data || {}).join(', ')}`);
      return { success: true };
    } else {
      console.log(`❌ Dashboard access failed: HTTP ${response.statusCode}`);
      console.log(`   - Error: ${response.data.error || response.data.message || 'Unknown error'}`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log(`❌ Dashboard access failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test debug endpoint
 */
async function testDebugEndpoint(baseUrl) {
  console.log(`\n🔍 Testing debug endpoint...`);
  
  try {
    const response = await makeRequest(`${baseUrl}/api/debug`);
    
    if (response.statusCode === 200) {
      console.log(`✅ Debug endpoint accessible`);
      console.log(`   - Environment: ${response.data.environment}`);
      console.log(`   - Demo mode: ${response.data.isDemoMode}`);
      console.log(`   - Database: ${response.data.database}`);
      return { success: true, data: response.data };
    } else {
      console.log(`❌ Debug endpoint failed: HTTP ${response.statusCode}`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log(`❌ Debug endpoint failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Run comprehensive test suite
 */
async function runTests(baseUrl, label) {
  console.log(`\n🚀 Testing ${label} (${baseUrl})`);
  console.log('='.repeat(60));
  
  const results = {
    label,
    baseUrl,
    debug: null,
    authentication: [],
    dashboardAccess: []
  };
  
  // Test debug endpoint
  results.debug = await testDebugEndpoint(baseUrl);
  
  // Test authentication for each credential set
  for (const credentials of TEST_CREDENTIALS) {
    const authResult = await testAuthentication(baseUrl, credentials);
    results.authentication.push({ credentials: credentials.name, ...authResult });
    
    // If authentication successful, test dashboard access
    if (authResult.success && authResult.token) {
      const dashboardResult = await testDashboardAccess(baseUrl, authResult.token);
      results.dashboardAccess.push({ user: credentials.name, ...dashboardResult });
    }
  }
  
  return results;
}

/**
 * Main test execution
 */
async function main() {
  console.log('🧪 MetroPower Dashboard Authentication Test Suite');
  console.log('================================================');
  
  const allResults = [];
  
  // Test local development server
  console.log('\n📍 Testing LOCAL development server...');
  try {
    const localResults = await runTests(LOCAL_BASE_URL, 'Local Development');
    allResults.push(localResults);
  } catch (error) {
    console.log(`❌ Local testing failed: ${error.message}`);
  }
  
  // Test Vercel deployment if URL provided
  if (VERCEL_BASE_URL) {
    console.log('\n🌐 Testing VERCEL deployment...');
    try {
      const vercelResults = await runTests(VERCEL_BASE_URL, 'Vercel Deployment');
      allResults.push(vercelResults);
    } catch (error) {
      console.log(`❌ Vercel testing failed: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n📋 TEST SUMMARY');
  console.log('===============');
  
  allResults.forEach(result => {
    console.log(`\n${result.label}:`);
    console.log(`  Debug endpoint: ${result.debug?.success ? '✅' : '❌'}`);
    
    result.authentication.forEach(auth => {
      console.log(`  ${auth.credentials}: ${auth.success ? '✅' : '❌'}`);
    });
    
    result.dashboardAccess.forEach(dashboard => {
      console.log(`  Dashboard (${dashboard.user}): ${dashboard.success ? '✅' : '❌'}`);
    });
  });
  
  // Final verdict
  const allAuthPassed = allResults.every(result => 
    result.authentication.every(auth => auth.success)
  );
  
  const allDashboardPassed = allResults.every(result => 
    result.dashboardAccess.every(dashboard => dashboard.success)
  );
  
  console.log('\n🎯 FINAL VERDICT');
  console.log('================');
  console.log(`Authentication: ${allAuthPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
  console.log(`Dashboard Access: ${allDashboardPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
  
  if (allAuthPassed && allDashboardPassed) {
    console.log('\n🎉 All tests passed! Antoine can successfully log in and access the dashboard.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the configuration and try again.');
  }
}

// Run tests
main().catch(console.error);
