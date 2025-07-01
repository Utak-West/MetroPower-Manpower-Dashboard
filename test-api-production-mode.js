/**
 * Production Mode API Test for MetroPower Dashboard
 * 
 * Tests all API endpoints to ensure they work correctly with Neon database
 * in production mode (no demo mode fallbacks)
 */

const fetch = require('node-fetch');

// Test configuration
const LOCAL_BASE_URL = 'http://localhost:3001';
const PRODUCTION_BASE_URL = 'https://metropower-manpower-dashboard-8hmgfkfk3-utaks-projects.vercel.app';

// Test credentials
const TEST_CREDENTIALS = {
  manager: {
    identifier: 'antione.harrell@metropower.com',
    password: 'MetroPower2025!'
  },
  admin: {
    identifier: 'admin@metropower.com', 
    password: 'MetroPower2025!'
  }
};

let authToken = null;

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers
      }
    });
    
    const data = await response.text();
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = { text: data };
    }
    
    return {
      status: response.status,
      ok: response.ok,
      data: jsonData
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

async function testAuthentication(baseUrl) {
  console.log('\n🔐 Testing Authentication...');
  
  // Test login with manager credentials
  const loginResponse = await makeRequest(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify(TEST_CREDENTIALS.manager)
  });
  
  if (loginResponse.ok && loginResponse.data.accessToken) {
    authToken = loginResponse.data.accessToken;
    console.log('✅ Manager login successful');
    console.log(`   User: ${loginResponse.data.user.first_name} ${loginResponse.data.user.last_name}`);
    console.log(`   Role: ${loginResponse.data.user.role}`);
    return true;
  } else {
    console.log('❌ Manager login failed:', loginResponse.data.message || loginResponse.error);
    return false;
  }
}

async function testEmployeesAPI(baseUrl) {
  console.log('\n👷 Testing Employees API...');
  
  // Test GET employees
  const getResponse = await makeRequest(`${baseUrl}/api/employees`);
  if (getResponse.ok) {
    console.log(`✅ GET employees: ${getResponse.data.length || 0} records`);
  } else {
    console.log('❌ GET employees failed:', getResponse.data.message || getResponse.error);
    return false;
  }
  
  // Test POST employee (create)
  const newEmployee = {
    employee_id: `TEST${Date.now()}`,
    name: 'Test Employee API',
    position_id: 1,
    status: 'Active',
    employee_number: `EMP${Date.now()}`,
    hire_date: '2025-01-01'
  };
  
  const createResponse = await makeRequest(`${baseUrl}/api/employees`, {
    method: 'POST',
    body: JSON.stringify(newEmployee)
  });
  
  if (createResponse.ok) {
    console.log('✅ POST employee (create) successful');
    
    // Test PUT employee (update)
    const updateData = {
      name: 'Updated Test Employee API',
      status: 'PTO'
    };
    
    const updateResponse = await makeRequest(`${baseUrl}/api/employees/${newEmployee.employee_id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    
    if (updateResponse.ok) {
      console.log('✅ PUT employee (update) successful');
    } else {
      console.log('❌ PUT employee failed:', updateResponse.data.message || updateResponse.error);
    }
    
    // Test DELETE employee
    const deleteResponse = await makeRequest(`${baseUrl}/api/employees/${newEmployee.employee_id}`, {
      method: 'DELETE'
    });
    
    if (deleteResponse.ok) {
      console.log('✅ DELETE employee successful');
    } else {
      console.log('❌ DELETE employee failed:', deleteResponse.data.message || deleteResponse.error);
    }
    
  } else {
    console.log('❌ POST employee failed:', createResponse.data.message || createResponse.error);
    return false;
  }
  
  return true;
}

async function testProjectsAPI(baseUrl) {
  console.log('\n🏗️ Testing Projects API...');
  
  // Test GET projects
  const getResponse = await makeRequest(`${baseUrl}/api/projects`);
  if (getResponse.ok) {
    console.log(`✅ GET projects: ${getResponse.data.length || 0} records`);
  } else {
    console.log('❌ GET projects failed:', getResponse.data.message || getResponse.error);
    return false;
  }
  
  // Test POST project (create)
  const newProject = {
    project_id: `TEST${Date.now()}`,
    name: 'Test Project API',
    number: `PRJ${Date.now()}`,
    status: 'Active',
    start_date: '2025-01-01',
    location: 'Test Location API',
    description: 'Test project created via API'
  };
  
  const createResponse = await makeRequest(`${baseUrl}/api/projects`, {
    method: 'POST',
    body: JSON.stringify(newProject)
  });
  
  if (createResponse.ok) {
    console.log('✅ POST project (create) successful');
    
    // Test PUT project (update)
    const updateData = {
      name: 'Updated Test Project API',
      status: 'On Hold'
    };
    
    const updateResponse = await makeRequest(`${baseUrl}/api/projects/${newProject.project_id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    
    if (updateResponse.ok) {
      console.log('✅ PUT project (update) successful');
    } else {
      console.log('❌ PUT project failed:', updateResponse.data.message || updateResponse.error);
    }
    
    // Test DELETE project
    const deleteResponse = await makeRequest(`${baseUrl}/api/projects/${newProject.project_id}`, {
      method: 'DELETE'
    });
    
    if (deleteResponse.ok) {
      console.log('✅ DELETE project successful');
    } else {
      console.log('❌ DELETE project failed:', deleteResponse.data.message || deleteResponse.error);
    }
    
  } else {
    console.log('❌ POST project failed:', createResponse.data.message || createResponse.error);
    return false;
  }
  
  return true;
}

async function testAssignmentsAPI(baseUrl) {
  console.log('\n📋 Testing Assignments API...');
  
  // Test GET assignments
  const getResponse = await makeRequest(`${baseUrl}/api/assignments`);
  if (getResponse.ok) {
    console.log(`✅ GET assignments: ${getResponse.data.length || 0} records`);
    return true;
  } else {
    console.log('❌ GET assignments failed:', getResponse.data.message || getResponse.error);
    return false;
  }
}

async function testDashboardAPI(baseUrl) {
  console.log('\n📊 Testing Dashboard API...');
  
  // Test dashboard stats
  const statsResponse = await makeRequest(`${baseUrl}/api/dashboard/stats`);
  if (statsResponse.ok) {
    console.log('✅ Dashboard stats successful');
    console.log(`   Employees: ${statsResponse.data.employees || 0}`);
    console.log(`   Projects: ${statsResponse.data.projects || 0}`);
    console.log(`   Assignments: ${statsResponse.data.assignments || 0}`);
    return true;
  } else {
    console.log('❌ Dashboard stats failed:', statsResponse.data.message || statsResponse.error);
    return false;
  }
}

async function runTests(baseUrl, environment) {
  console.log(`\n🧪 Testing ${environment} Environment: ${baseUrl}`);
  console.log('='.repeat(60));
  
  const results = {
    environment,
    baseUrl,
    tests: {
      authentication: false,
      employees: false,
      projects: false,
      assignments: false,
      dashboard: false
    }
  };
  
  // Test authentication first
  results.tests.authentication = await testAuthentication(baseUrl);
  if (!results.tests.authentication) {
    console.log('❌ Authentication failed - skipping other tests');
    return results;
  }
  
  // Test all APIs
  results.tests.employees = await testEmployeesAPI(baseUrl);
  results.tests.projects = await testProjectsAPI(baseUrl);
  results.tests.assignments = await testAssignmentsAPI(baseUrl);
  results.tests.dashboard = await testDashboardAPI(baseUrl);
  
  return results;
}

async function main() {
  console.log('🧪 MetroPower Dashboard - Production Mode API Test');
  console.log('==================================================');
  
  const allResults = [];
  
  // Test local development
  console.log('\n🏠 Testing Local Development...');
  try {
    const localResults = await runTests(LOCAL_BASE_URL, 'Local Development');
    allResults.push(localResults);
  } catch (error) {
    console.log('❌ Local development test failed:', error.message);
    allResults.push({
      environment: 'Local Development',
      baseUrl: LOCAL_BASE_URL,
      error: error.message,
      tests: {}
    });
  }
  
  // Test production deployment
  console.log('\n🌐 Testing Production Deployment...');
  try {
    const prodResults = await runTests(PRODUCTION_BASE_URL, 'Production');
    allResults.push(prodResults);
  } catch (error) {
    console.log('❌ Production test failed:', error.message);
    allResults.push({
      environment: 'Production',
      baseUrl: PRODUCTION_BASE_URL,
      error: error.message,
      tests: {}
    });
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  
  allResults.forEach(result => {
    console.log(`\n${result.environment}:`);
    if (result.error) {
      console.log(`  ❌ Environment Error: ${result.error}`);
    } else {
      Object.entries(result.tests).forEach(([test, passed]) => {
        console.log(`  ${passed ? '✅' : '❌'} ${test}`);
      });
    }
  });
  
  const allTestsPassed = allResults.every(result => 
    !result.error && Object.values(result.tests).every(test => test)
  );
  
  if (allTestsPassed) {
    console.log('\n🎉 All tests passed! Production mode is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the results above.');
  }
}

main().catch(console.error);
