#!/bin/bash

BASE_URL="http://localhost:3001"

echo "🔄 COMPREHENSIVE DATABASE SYNCHRONIZATION TEST"
echo "=============================================="
echo "Testing all CRUD operations with Neon PostgreSQL database"
echo ""

# Get admin token
echo "🔐 Getting admin authentication..."
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@metropower.com","password":"MetroPower2025!"}')

ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Failed to get admin token"
  exit 1
fi

echo "✅ Admin authenticated"
echo ""

# Test 1: Employee CRUD Operations
echo "👥 TESTING EMPLOYEE CRUD OPERATIONS"
echo "-----------------------------------"

# CREATE Employee
echo "➕ Creating new employee..."
EMPLOYEE_CREATE=$(curl -s -X POST "$BASE_URL/api/employees" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Database",
    "last_name": "Sync Test",
    "trade": "Electrician",
    "level": "Journeyman",
    "hourly_rate": "35.00",
    "phone": "555-TEST",
    "email": "dbsync.test@metropower.com",
    "hire_date": "2025-01-01",
    "notes": "Database sync test employee"
  }')

if echo "$EMPLOYEE_CREATE" | grep -q '"success":true'; then
  EMPLOYEE_ID=$(echo "$EMPLOYEE_CREATE" | grep -o '"employee_id":"[^"]*"' | cut -d'"' -f4)
  echo "✅ Employee created with ID: $EMPLOYEE_ID"
else
  echo "❌ Employee creation failed"
  echo "Response: $EMPLOYEE_CREATE"
fi

# READ Employee
if [ ! -z "$EMPLOYEE_ID" ]; then
  echo "📖 Reading created employee..."
  EMPLOYEE_READ=$(curl -s -X GET "$BASE_URL/api/employees/$EMPLOYEE_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
  if echo "$EMPLOYEE_READ" | grep -q '"Database Sync Test"'; then
    echo "✅ Employee read successful"
  else
    echo "❌ Employee read failed"
  fi
fi

# UPDATE Employee
if [ ! -z "$EMPLOYEE_ID" ]; then
  echo "✏️  Updating employee..."
  EMPLOYEE_UPDATE=$(curl -s -X PUT "$BASE_URL/api/employees/$EMPLOYEE_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "phone": "555-UPDATED",
      "notes": "Updated database sync test employee"
    }')
  
  if echo "$EMPLOYEE_UPDATE" | grep -q '"success":true'; then
    echo "✅ Employee updated successfully"
  else
    echo "❌ Employee update failed"
    echo "Response: $EMPLOYEE_UPDATE"
  fi
fi

echo ""

# Test 2: Project CRUD Operations
echo "🏗️  TESTING PROJECT CRUD OPERATIONS"
echo "-----------------------------------"

# CREATE Project
echo "➕ Creating new project..."
PROJECT_CREATE=$(curl -s -X POST "$BASE_URL/api/projects" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "DBTEST001",
    "name": "Database Sync Test Project",
    "number": "TST-001",
    "status": "Active",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "location": "Test Site",
    "description": "Project for database synchronization testing",
    "budget": 100000
  }')

if echo "$PROJECT_CREATE" | grep -q '"success":true'; then
  PROJECT_ID="DBTEST001"
  echo "✅ Project created with ID: $PROJECT_ID"
else
  echo "❌ Project creation failed"
  echo "Response: $PROJECT_CREATE"
fi

# READ Project
if [ ! -z "$PROJECT_ID" ]; then
  echo "📖 Reading created project..."
  PROJECT_READ=$(curl -s -X GET "$BASE_URL/api/projects/$PROJECT_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
  if echo "$PROJECT_READ" | grep -q '"Database Sync Test Project"'; then
    echo "✅ Project read successful"
  else
    echo "❌ Project read failed"
  fi
fi

# UPDATE Project
if [ ! -z "$PROJECT_ID" ]; then
  echo "✏️  Updating project..."
  PROJECT_UPDATE=$(curl -s -X PUT "$BASE_URL/api/projects/$PROJECT_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "description": "Updated database sync test project",
      "budget": 150000
    }')
  
  if echo "$PROJECT_UPDATE" | grep -q '"success":true'; then
    echo "✅ Project updated successfully"
  else
    echo "❌ Project update failed"
    echo "Response: $PROJECT_UPDATE"
  fi
fi

echo ""

# Test 3: Assignment CRUD Operations
echo "📋 TESTING ASSIGNMENT CRUD OPERATIONS"
echo "-------------------------------------"

if [ ! -z "$EMPLOYEE_ID" ] && [ ! -z "$PROJECT_ID" ]; then
  # CREATE Assignment
  echo "➕ Creating new assignment..."
  ASSIGNMENT_CREATE=$(curl -s -X POST "$BASE_URL/api/assignments" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "employee_id": "'$EMPLOYEE_ID'",
      "project_id": "'$PROJECT_ID'",
      "assignment_date": "2025-01-15",
      "notes": "Database sync test assignment"
    }')
  
  if echo "$ASSIGNMENT_CREATE" | grep -q '"success":true'; then
    ASSIGNMENT_ID=$(echo "$ASSIGNMENT_CREATE" | grep -o '"assignment_id":[0-9]*' | cut -d':' -f2)
    echo "✅ Assignment created with ID: $ASSIGNMENT_ID"
  else
    echo "❌ Assignment creation failed"
    echo "Response: $ASSIGNMENT_CREATE"
  fi
  
  # READ Assignment
  if [ ! -z "$ASSIGNMENT_ID" ]; then
    echo "📖 Reading created assignment..."
    ASSIGNMENT_READ=$(curl -s -X GET "$BASE_URL/api/assignments/$ASSIGNMENT_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    if echo "$ASSIGNMENT_READ" | grep -q '"assignment_id":'$ASSIGNMENT_ID; then
      echo "✅ Assignment read successful"
    else
      echo "❌ Assignment read failed"
    fi
  fi
  
  # UPDATE Assignment
  if [ ! -z "$ASSIGNMENT_ID" ]; then
    echo "✏️  Updating assignment..."
    ASSIGNMENT_UPDATE=$(curl -s -X PUT "$BASE_URL/api/assignments/$ASSIGNMENT_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "notes": "Updated database sync test assignment"
      }')
    
    if echo "$ASSIGNMENT_UPDATE" | grep -q '"success":true'; then
      echo "✅ Assignment updated successfully"
    else
      echo "❌ Assignment update failed"
      echo "Response: $ASSIGNMENT_UPDATE"
    fi
  fi
else
  echo "⚠️  Skipping assignment tests - missing employee or project ID"
fi

echo ""

# Test 4: Data Persistence Verification
echo "💾 TESTING DATA PERSISTENCE"
echo "---------------------------"
echo "Verifying data exists in Neon database..."

# Direct database query to verify persistence
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgres://neondb_owner:npg_FIzeB8CoU3tM@ep-small-wildflower-a4s9we42-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    const client = await pool.connect();
    
    // Check if our test employee exists
    const empResult = await client.query('SELECT * FROM employees WHERE email = \$1', ['dbsync.test@metropower.com']);
    if (empResult.rows.length > 0) {
      console.log('✅ Test employee found in database');
    } else {
      console.log('❌ Test employee not found in database');
    }
    
    // Check if our test project exists
    const projResult = await client.query('SELECT * FROM projects WHERE project_id = \$1', ['DBTEST001']);
    if (projResult.rows.length > 0) {
      console.log('✅ Test project found in database');
    } else {
      console.log('❌ Test project not found in database');
    }
    
    // Check total counts
    const empCount = await client.query('SELECT COUNT(*) FROM employees');
    const projCount = await client.query('SELECT COUNT(*) FROM projects');
    const assignCount = await client.query('SELECT COUNT(*) FROM assignments');
    
    console.log('📊 Database counts:');
    console.log('   Employees: ' + empCount.rows[0].count);
    console.log('   Projects: ' + projCount.rows[0].count);
    console.log('   Assignments: ' + assignCount.rows[0].count);
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
  }
})();
"

echo ""

# Cleanup
echo "🧹 CLEANUP"
echo "----------"

# Delete test assignment
if [ ! -z "$ASSIGNMENT_ID" ]; then
  echo "Deleting test assignment..."
  curl -s -X DELETE "$BASE_URL/api/assignments/$ASSIGNMENT_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
  echo "✅ Test assignment deleted"
fi

# Delete test project
if [ ! -z "$PROJECT_ID" ]; then
  echo "Deleting test project..."
  curl -s -X DELETE "$BASE_URL/api/projects/$PROJECT_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
  echo "✅ Test project deleted"
fi

# Delete test employee
if [ ! -z "$EMPLOYEE_ID" ]; then
  echo "Deleting test employee..."
  curl -s -X DELETE "$BASE_URL/api/employees/$EMPLOYEE_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
  echo "✅ Test employee deleted"
fi

echo ""
echo "🎉 DATABASE SYNCHRONIZATION TEST COMPLETED"
echo "=========================================="
echo "All operations tested against Neon PostgreSQL database"
