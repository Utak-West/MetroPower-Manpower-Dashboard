#!/bin/bash

BASE_URL="http://localhost:3001"

echo "👥 Testing Employee CRUD Operations..."
echo ""

# Get admin token first
echo "Getting admin authentication token..."
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@metropower.com","password":"MetroPower2025!"}')

ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Failed to get admin token"
  exit 1
fi

echo "✅ Admin token obtained"
echo ""

# Test READ - Get all employees
echo "📖 Testing READ - Get all employees..."
EMPLOYEES_RESPONSE=$(curl -s -X GET "$BASE_URL/api/employees" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$EMPLOYEES_RESPONSE" | grep -q '"employee_id"'; then
  EMPLOYEE_COUNT=$(echo "$EMPLOYEES_RESPONSE" | grep -o '"employee_id"' | wc -l)
  echo "✅ READ successful - Found $EMPLOYEE_COUNT employees"
else
  echo "❌ READ failed"
  echo "Response: $EMPLOYEES_RESPONSE"
fi

echo ""

# Test CREATE - Add new employee
echo "➕ Testing CREATE - Add new employee..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/employees" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "TEST001",
    "first_name": "Test",
    "last_name": "Employee",
    "trade": "General Laborer",
    "level": "Entry",
    "hourly_rate": "25.00",
    "position_id": 1,
    "status": "Active",
    "phone": "555-0123",
    "email": "test.employee@metropower.com",
    "hire_date": "2025-01-01",
    "notes": "Test employee for CRUD testing"
  }')

if echo "$CREATE_RESPONSE" | grep -q '"success":true'; then
  echo "✅ CREATE successful - New employee added"
  # Extract the actual employee ID from response
  NEW_EMPLOYEE_ID=$(echo "$CREATE_RESPONSE" | grep -o '"employee_id":"[^"]*"' | cut -d'"' -f4)
  echo "   Employee ID: $NEW_EMPLOYEE_ID"
else
  echo "❌ CREATE failed"
  echo "Response: $CREATE_RESPONSE"
fi

echo ""

# Test READ - Get specific employee
if [ ! -z "$NEW_EMPLOYEE_ID" ]; then
  echo "📖 Testing READ - Get specific employee..."
  SINGLE_EMPLOYEE_RESPONSE=$(curl -s -X GET "$BASE_URL/api/employees/$NEW_EMPLOYEE_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
  if echo "$SINGLE_EMPLOYEE_RESPONSE" | grep -q '"employee_id":"TEST001"'; then
    echo "✅ READ specific employee successful"
  else
    echo "❌ READ specific employee failed"
    echo "Response: $SINGLE_EMPLOYEE_RESPONSE"
  fi
  echo ""
fi

# Test UPDATE - Modify employee
if [ ! -z "$NEW_EMPLOYEE_ID" ]; then
  echo "✏️  Testing UPDATE - Modify employee..."
  UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/employees/$NEW_EMPLOYEE_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "first_name": "Updated",
      "last_name": "Employee",
      "phone": "555-9999",
      "notes": "Updated test employee"
    }')
  
  if echo "$UPDATE_RESPONSE" | grep -q '"first_name":"Updated"'; then
    echo "✅ UPDATE successful - Employee modified"
  else
    echo "❌ UPDATE failed"
    echo "Response: $UPDATE_RESPONSE"
  fi
  echo ""
fi

# Test DELETE - Remove employee
if [ ! -z "$NEW_EMPLOYEE_ID" ]; then
  echo "🗑️  Testing DELETE - Remove employee..."
  DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/employees/$NEW_EMPLOYEE_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
  if echo "$DELETE_RESPONSE" | grep -q -v '"error"'; then
    echo "✅ DELETE successful - Employee removed"
    
    # Verify deletion
    echo "Verifying deletion..."
    VERIFY_RESPONSE=$(curl -s -X GET "$BASE_URL/api/employees/$NEW_EMPLOYEE_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    if echo "$VERIFY_RESPONSE" | grep -q '"error"'; then
      echo "✅ DELETE verified - Employee no longer exists"
    else
      echo "⚠️  DELETE verification failed - Employee still exists"
    fi
  else
    echo "❌ DELETE failed"
    echo "Response: $DELETE_RESPONSE"
  fi
  echo ""
fi

# Test authorization - Try with manager token
echo "🔒 Testing authorization - Manager access..."
MANAGER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"antione.harrell@metropower.com","password":"MetroPower2025!"}')

MANAGER_TOKEN=$(echo "$MANAGER_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$MANAGER_TOKEN" ]; then
  # Manager should be able to read
  MANAGER_READ_RESPONSE=$(curl -s -X GET "$BASE_URL/api/employees" \
    -H "Authorization: Bearer $MANAGER_TOKEN")
  
  if echo "$MANAGER_READ_RESPONSE" | grep -q '"employee_id"'; then
    echo "✅ Manager can READ employees"
  else
    echo "❌ Manager cannot read employees"
  fi
  
  # Test if manager can create (depends on role permissions)
  MANAGER_CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/employees" \
    -H "Authorization: Bearer $MANAGER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "employee_id": "MGR001",
      "first_name": "Manager",
      "last_name": "Test",
      "trade": "General Laborer",
      "level": "Entry",
      "hourly_rate": "25.00",
      "position_id": 1,
      "status": "Active"
    }')
  
  if echo "$MANAGER_CREATE_RESPONSE" | grep -q '"employee_id":"MGR001"'; then
    echo "✅ Manager can create employees"
    # Clean up
    curl -s -X DELETE "$BASE_URL/api/employees/MGR001" \
      -H "Authorization: Bearer $MANAGER_TOKEN" > /dev/null
  else
    echo "ℹ️  Manager cannot create employees (role restriction)"
  fi
else
  echo "❌ Failed to get manager token"
fi

echo ""
echo "👥 Employee CRUD testing completed"
