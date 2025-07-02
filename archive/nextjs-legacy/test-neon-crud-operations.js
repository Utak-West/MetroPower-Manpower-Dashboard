/**
 * Comprehensive CRUD Operations Test for Neon PostgreSQL Database
 * 
 * Tests all Create, Read, Update, Delete operations for:
 * - Users (authentication)
 * - Employees 
 * - Projects
 * - Assignments
 * - Positions
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database connection
const pool = new Pool({
  connectionString: 'postgres://neondb_owner:npg_FIzeB8CoU3tM@ep-small-wildflower-a4s9we42-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

function logTest(testName, success, error = null) {
  if (success) {
    console.log(`✅ ${testName}`);
    testResults.passed++;
  } else {
    console.log(`❌ ${testName}: ${error}`);
    testResults.failed++;
    testResults.errors.push({ test: testName, error });
  }
}

async function testDatabaseConnection() {
  console.log('\n🔍 Testing Database Connection...');
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    client.release();
    
    logTest('Database Connection', true);
    console.log(`   Current time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL version: ${result.rows[0].version.split(' ')[0]}`);
    return true;
  } catch (error) {
    logTest('Database Connection', false, error.message);
    return false;
  }
}

async function testUsersCRUD() {
  console.log('\n👤 Testing Users CRUD Operations...');
  
  try {
    // CREATE - Test user creation
    const testEmail = `test.user.${Date.now()}@metropower.com`;
    const testUsername = `testuser${Date.now()}`;
    const passwordHash = await bcrypt.hash('TestPassword123!', 12);
    
    const createResult = await pool.query(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING user_id, username, email
    `, [testUsername, testEmail, passwordHash, 'Test', 'User', 'View Only', true]);
    
    const newUserId = createResult.rows[0].user_id;
    logTest('Users CREATE', true);
    
    // READ - Test user retrieval
    const readResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [newUserId]);
    logTest('Users READ', readResult.rows.length === 1);
    
    // UPDATE - Test user modification
    await pool.query(`
      UPDATE users 
      SET first_name = $1, last_name = $2, role = $3
      WHERE user_id = $4
    `, ['Updated', 'TestUser', 'HR', newUserId]);
    
    const updateCheck = await pool.query('SELECT first_name, last_name, role FROM users WHERE user_id = $1', [newUserId]);
    const updated = updateCheck.rows[0];
    logTest('Users UPDATE', updated.first_name === 'Updated' && updated.role === 'HR');
    
    // DELETE - Test user deletion
    await pool.query('DELETE FROM users WHERE user_id = $1', [newUserId]);
    const deleteCheck = await pool.query('SELECT * FROM users WHERE user_id = $1', [newUserId]);
    logTest('Users DELETE', deleteCheck.rows.length === 0);
    
  } catch (error) {
    logTest('Users CRUD', false, error.message);
  }
}

async function testEmployeesCRUD() {
  console.log('\n👷 Testing Employees CRUD Operations...');
  
  try {
    // Get a position ID for testing
    const positionResult = await pool.query('SELECT position_id FROM positions LIMIT 1');
    const positionId = positionResult.rows[0]?.position_id;
    
    if (!positionId) {
      logTest('Employees CRUD', false, 'No positions found for testing');
      return;
    }
    
    // CREATE - Test employee creation
    const testEmployeeId = `TEST${Date.now()}`;
    const createResult = await pool.query(`
      INSERT INTO employees (employee_id, name, position_id, status, employee_number, hire_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING employee_id, name
    `, [testEmployeeId, 'Test Employee', positionId, 'Active', `EMP${Date.now()}`, '2025-01-01']);
    
    logTest('Employees CREATE', createResult.rows.length === 1);
    
    // READ - Test employee retrieval
    const readResult = await pool.query('SELECT * FROM employees WHERE employee_id = $1', [testEmployeeId]);
    logTest('Employees READ', readResult.rows.length === 1);
    
    // UPDATE - Test employee modification
    await pool.query(`
      UPDATE employees 
      SET name = $1, status = $2
      WHERE employee_id = $3
    `, ['Updated Test Employee', 'PTO', testEmployeeId]);
    
    const updateCheck = await pool.query('SELECT name, status FROM employees WHERE employee_id = $1', [testEmployeeId]);
    const updated = updateCheck.rows[0];
    logTest('Employees UPDATE', updated.name === 'Updated Test Employee' && updated.status === 'PTO');
    
    // DELETE - Test employee deletion
    await pool.query('DELETE FROM employees WHERE employee_id = $1', [testEmployeeId]);
    const deleteCheck = await pool.query('SELECT * FROM employees WHERE employee_id = $1', [testEmployeeId]);
    logTest('Employees DELETE', deleteCheck.rows.length === 0);
    
  } catch (error) {
    logTest('Employees CRUD', false, error.message);
  }
}

async function testProjectsCRUD() {
  console.log('\n🏗️ Testing Projects CRUD Operations...');
  
  try {
    // CREATE - Test project creation
    const testProjectId = `TEST${Date.now()}`;
    const createResult = await pool.query(`
      INSERT INTO projects (project_id, name, number, status, start_date, location, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING project_id, name
    `, [testProjectId, 'Test Project', `PRJ${Date.now()}`, 'Active', '2025-01-01', 'Test Location', 'Test project description']);
    
    logTest('Projects CREATE', createResult.rows.length === 1);
    
    // READ - Test project retrieval
    const readResult = await pool.query('SELECT * FROM projects WHERE project_id = $1', [testProjectId]);
    logTest('Projects READ', readResult.rows.length === 1);
    
    // UPDATE - Test project modification
    await pool.query(`
      UPDATE projects 
      SET name = $1, status = $2, location = $3
      WHERE project_id = $4
    `, ['Updated Test Project', 'On Hold', 'Updated Location', testProjectId]);
    
    const updateCheck = await pool.query('SELECT name, status, location FROM projects WHERE project_id = $1', [testProjectId]);
    const updated = updateCheck.rows[0];
    logTest('Projects UPDATE', updated.name === 'Updated Test Project' && updated.status === 'On Hold');
    
    // DELETE - Test project deletion
    await pool.query('DELETE FROM projects WHERE project_id = $1', [testProjectId]);
    const deleteCheck = await pool.query('SELECT * FROM projects WHERE project_id = $1', [testProjectId]);
    logTest('Projects DELETE', deleteCheck.rows.length === 0);
    
  } catch (error) {
    logTest('Projects CRUD', false, error.message);
  }
}

async function testAssignmentsCRUD() {
  console.log('\n📋 Testing Assignments CRUD Operations...');
  
  try {
    // Get existing employee and project for testing
    const employeeResult = await pool.query('SELECT employee_id FROM employees LIMIT 1');
    const projectResult = await pool.query('SELECT project_id FROM projects LIMIT 1');
    const userResult = await pool.query('SELECT user_id FROM users LIMIT 1');
    
    const employeeId = employeeResult.rows[0]?.employee_id;
    const projectId = projectResult.rows[0]?.project_id;
    const userId = userResult.rows[0]?.user_id;
    
    if (!employeeId || !projectId || !userId) {
      logTest('Assignments CRUD', false, 'Missing required data for testing');
      return;
    }
    
    // CREATE - Test assignment creation
    const testDate = '2025-07-15';
    const createResult = await pool.query(`
      INSERT INTO assignments (employee_id, project_id, assignment_date, created_by, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING assignment_id
    `, [employeeId, projectId, testDate, userId, 'Test assignment']);
    
    const assignmentId = createResult.rows[0].assignment_id;
    logTest('Assignments CREATE', createResult.rows.length === 1);
    
    // READ - Test assignment retrieval
    const readResult = await pool.query('SELECT * FROM assignments WHERE assignment_id = $1', [assignmentId]);
    logTest('Assignments READ', readResult.rows.length === 1);
    
    // UPDATE - Test assignment modification
    await pool.query(`
      UPDATE assignments 
      SET notes = $1, updated_by = $2
      WHERE assignment_id = $3
    `, ['Updated test assignment', userId, assignmentId]);
    
    const updateCheck = await pool.query('SELECT notes FROM assignments WHERE assignment_id = $1', [assignmentId]);
    const updated = updateCheck.rows[0];
    logTest('Assignments UPDATE', updated.notes === 'Updated test assignment');
    
    // DELETE - Test assignment deletion
    await pool.query('DELETE FROM assignments WHERE assignment_id = $1', [assignmentId]);
    const deleteCheck = await pool.query('SELECT * FROM assignments WHERE assignment_id = $1', [assignmentId]);
    logTest('Assignments DELETE', deleteCheck.rows.length === 0);
    
  } catch (error) {
    logTest('Assignments CRUD', false, error.message);
  }
}

async function testDataPersistence() {
  console.log('\n💾 Testing Data Persistence...');
  
  try {
    // Test that existing data persists
    const usersCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const employeesCount = await pool.query('SELECT COUNT(*) as count FROM employees');
    const projectsCount = await pool.query('SELECT COUNT(*) as count FROM projects');
    const assignmentsCount = await pool.query('SELECT COUNT(*) as count FROM assignments');
    
    console.log(`   Users: ${usersCount.rows[0].count} records`);
    console.log(`   Employees: ${employeesCount.rows[0].count} records`);
    console.log(`   Projects: ${projectsCount.rows[0].count} records`);
    console.log(`   Assignments: ${assignmentsCount.rows[0].count} records`);
    
    logTest('Data Persistence Check', 
      parseInt(usersCount.rows[0].count) > 0 && 
      parseInt(employeesCount.rows[0].count) > 0 &&
      parseInt(projectsCount.rows[0].count) > 0
    );
    
  } catch (error) {
    logTest('Data Persistence', false, error.message);
  }
}

async function runAllTests() {
  console.log('🧪 MetroPower Dashboard - Neon PostgreSQL CRUD Operations Test');
  console.log('================================================================');
  
  const connected = await testDatabaseConnection();
  if (!connected) {
    console.log('\n❌ Database connection failed. Aborting tests.');
    return;
  }
  
  await testUsersCRUD();
  await testEmployeesCRUD();
  await testProjectsCRUD();
  await testAssignmentsCRUD();
  await testDataPersistence();
  
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
  
  await pool.end();
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Neon database CRUD operations are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
}

// Run the tests
runAllTests().catch(console.error);
