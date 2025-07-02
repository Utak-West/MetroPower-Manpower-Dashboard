/**
 * Complete Production CRUD Test for MetroPower Dashboard
 * 
 * Tests all CRUD operations in the production Vercel environment
 * to ensure data persistence and functionality work correctly
 */

const fetch = require('node-fetch');

const PRODUCTION_URL = 'https://metropower-manpower-dashboard-or04srijq-utaks-projects.vercel.app';
const TEST_CREDENTIALS = {
  identifier: 'antione.harrell@metropower.com',
  password: 'MetroPower2025!'
};

let authToken = null;
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

function logTest(testName, success, details = '') {
  if (success) {
    console.log(`✅ ${testName}`);
    if (details) console.log(`   ${details}`);
    testResults.passed++;
  } else {
    console.log(`❌ ${testName}: ${details}`);
    testResults.failed++;
    testResults.errors.push({ test: testName, error: details });
  }
}

async function makeRequest(endpoint, options = {}) {
  try {
    const url = `${PRODUCTION_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers
      }
    });
    
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { text };
    }
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

async function testAuthentication() {
  console.log('\n🔐 Testing Production Authentication...');
  
  const response = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(TEST_CREDENTIALS)
  });
  
  if (response.ok && response.data.accessToken) {
    authToken = response.data.accessToken;
    logTest('Authentication', true, `Logged in as ${response.data.user.first_name} ${response.data.user.last_name} (${response.data.user.role})`);
    return true;
  } else {
    logTest('Authentication', false, response.data.message || response.error);
    return false;
  }
}

async function testEmployeesCRUD() {
  console.log('\n👷 Testing Employees CRUD in Production...');
  
  try {
    // READ - Get existing employees
    const getResponse = await makeRequest('/api/employees');
    if (getResponse.ok) {
      logTest('Employees READ', true, `Found ${getResponse.data.length} employees`);
    } else {
      logTest('Employees READ', false, getResponse.data.message || getResponse.error);
      return false;
    }
    
    // Get a position for testing
    const positionsResponse = await makeRequest('/api/positions');
    if (!positionsResponse.ok || positionsResponse.data.length === 0) {
      logTest('Employees CRUD', false, 'No positions available for testing');
      return false;
    }
    
    const positionId = positionsResponse.data[0].position_id;
    
    // CREATE - Add new employee
    const newEmployee = {
      employee_id: `PROD${Date.now()}`,
      name: 'Production Test Employee',
      position_id: positionId,
      status: 'Active',
      employee_number: `EMP${Date.now()}`,
      hire_date: '2025-01-01'
    };
    
    const createResponse = await makeRequest('/api/employees', {
      method: 'POST',
      body: JSON.stringify(newEmployee)
    });
    
    if (createResponse.ok) {
      logTest('Employees CREATE', true, `Created employee ${newEmployee.employee_id}`);
      
      // UPDATE - Modify employee
      const updateData = {
        name: 'Updated Production Test Employee',
        status: 'PTO'
      };
      
      const updateResponse = await makeRequest(`/api/employees/${newEmployee.employee_id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      if (updateResponse.ok) {
        logTest('Employees UPDATE', true, 'Employee updated successfully');
        
        // Verify update persisted
        const verifyResponse = await makeRequest(`/api/employees/${newEmployee.employee_id}`);
        if (verifyResponse.ok && verifyResponse.data.name === updateData.name) {
          logTest('Employees UPDATE Persistence', true, 'Update persisted correctly');
        } else {
          logTest('Employees UPDATE Persistence', false, 'Update did not persist');
        }
      } else {
        logTest('Employees UPDATE', false, updateResponse.data.message || updateResponse.error);
      }
      
      // DELETE - Remove employee
      const deleteResponse = await makeRequest(`/api/employees/${newEmployee.employee_id}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        logTest('Employees DELETE', true, 'Employee deleted successfully');
        
        // Verify deletion persisted
        const verifyDeleteResponse = await makeRequest(`/api/employees/${newEmployee.employee_id}`);
        if (verifyDeleteResponse.status === 404) {
          logTest('Employees DELETE Persistence', true, 'Deletion persisted correctly');
        } else {
          logTest('Employees DELETE Persistence', false, 'Deletion did not persist');
        }
      } else {
        logTest('Employees DELETE', false, deleteResponse.data.message || deleteResponse.error);
      }
      
    } else {
      logTest('Employees CREATE', false, createResponse.data.message || createResponse.error);
      return false;
    }
    
    return true;
  } catch (error) {
    logTest('Employees CRUD', false, error.message);
    return false;
  }
}

async function testProjectsCRUD() {
  console.log('\n🏗️ Testing Projects CRUD in Production...');
  
  try {
    // READ - Get existing projects
    const getResponse = await makeRequest('/api/projects');
    if (getResponse.ok) {
      logTest('Projects READ', true, `Found ${getResponse.data.length} projects`);
    } else {
      logTest('Projects READ', false, getResponse.data.message || getResponse.error);
      return false;
    }
    
    // CREATE - Add new project
    const newProject = {
      project_id: `PROD${Date.now()}`,
      name: 'Production Test Project',
      number: `PRJ${Date.now()}`,
      status: 'Active',
      start_date: '2025-01-01',
      location: 'Production Test Location',
      description: 'Test project for production CRUD verification'
    };
    
    const createResponse = await makeRequest('/api/projects', {
      method: 'POST',
      body: JSON.stringify(newProject)
    });
    
    if (createResponse.ok) {
      logTest('Projects CREATE', true, `Created project ${newProject.project_id}`);
      
      // UPDATE - Modify project
      const updateData = {
        name: 'Updated Production Test Project',
        status: 'On Hold',
        location: 'Updated Test Location'
      };
      
      const updateResponse = await makeRequest(`/api/projects/${newProject.project_id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      if (updateResponse.ok) {
        logTest('Projects UPDATE', true, 'Project updated successfully');
        
        // Verify update persisted
        const verifyResponse = await makeRequest(`/api/projects/${newProject.project_id}`);
        if (verifyResponse.ok && verifyResponse.data.name === updateData.name) {
          logTest('Projects UPDATE Persistence', true, 'Update persisted correctly');
        } else {
          logTest('Projects UPDATE Persistence', false, 'Update did not persist');
        }
      } else {
        logTest('Projects UPDATE', false, updateResponse.data.message || updateResponse.error);
      }
      
      // DELETE - Remove project
      const deleteResponse = await makeRequest(`/api/projects/${newProject.project_id}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        logTest('Projects DELETE', true, 'Project deleted successfully');
        
        // Verify deletion persisted
        const verifyDeleteResponse = await makeRequest(`/api/projects/${newProject.project_id}`);
        if (verifyDeleteResponse.status === 404) {
          logTest('Projects DELETE Persistence', true, 'Deletion persisted correctly');
        } else {
          logTest('Projects DELETE Persistence', false, 'Deletion did not persist');
        }
      } else {
        logTest('Projects DELETE', false, deleteResponse.data.message || deleteResponse.error);
      }
      
    } else {
      logTest('Projects CREATE', false, createResponse.data.message || createResponse.error);
      return false;
    }
    
    return true;
  } catch (error) {
    logTest('Projects CRUD', false, error.message);
    return false;
  }
}

async function testDataPersistence() {
  console.log('\n💾 Testing Data Persistence Across Sessions...');
  
  try {
    // Clear auth token to simulate new session
    const originalToken = authToken;
    authToken = null;
    
    // Re-authenticate
    const authResponse = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(TEST_CREDENTIALS)
    });
    
    if (authResponse.ok) {
      authToken = authResponse.data.accessToken;
      logTest('Session Re-authentication', true, 'Successfully re-authenticated');
      
      // Verify data still exists
      const employeesResponse = await makeRequest('/api/employees');
      const projectsResponse = await makeRequest('/api/projects');
      const assignmentsResponse = await makeRequest('/api/assignments');
      
      if (employeesResponse.ok && projectsResponse.ok && assignmentsResponse.ok) {
        logTest('Data Persistence', true, 
          `Data persisted: ${employeesResponse.data.length} employees, ${projectsResponse.data.length} projects, ${assignmentsResponse.data.length} assignments`);
      } else {
        logTest('Data Persistence', false, 'Failed to retrieve data after re-authentication');
      }
    } else {
      logTest('Session Re-authentication', false, authResponse.data.message || authResponse.error);
    }
    
  } catch (error) {
    logTest('Data Persistence', false, error.message);
  }
}

async function runAllTests() {
  console.log('🧪 MetroPower Dashboard - Complete Production CRUD Test');
  console.log('========================================================');
  console.log(`Testing: ${PRODUCTION_URL}`);
  
  // Test authentication first
  const authSuccess = await testAuthentication();
  if (!authSuccess) {
    console.log('\n❌ Authentication failed - aborting tests');
    return;
  }
  
  // Run all CRUD tests
  await testEmployeesCRUD();
  await testProjectsCRUD();
  await testDataPersistence();
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🔍 ERROR DETAILS:');
    testResults.errors.forEach(({ test, error }) => {
      console.log(`   ${test}: ${error}`);
    });
  }
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Production CRUD operations are working correctly.');
    console.log('✅ Database connection: Working');
    console.log('✅ Authentication: Working');
    console.log('✅ CRUD operations: Working');
    console.log('✅ Data persistence: Working');
    console.log('✅ Production deployment: Fully operational');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
}

// Run the tests
runAllTests().catch(console.error);
