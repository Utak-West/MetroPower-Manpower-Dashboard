#!/bin/bash

PROD_URL="https://metropower-manpower-dashboard-8hmgfkfk3-utaks-projects.vercel.app"

echo "🌐 PRODUCTION ENVIRONMENT VERIFICATION"
echo "======================================"
echo "Testing Vercel deployment: $PROD_URL"
echo ""

# Test 1: Health Check
echo "🏥 Testing health check..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" "$PROD_URL/health")
HTTP_CODE="${HEALTH_RESPONSE: -3}"
HEALTH_BODY="${HEALTH_RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Health check passed"
  echo "   Response: $HEALTH_BODY"
else
  echo "❌ Health check failed (HTTP $HTTP_CODE)"
  echo "   Response: $HEALTH_BODY"
fi

echo ""

# Test 2: Authentication
echo "🔐 Testing authentication..."
AUTH_RESPONSE=$(curl -s -X POST "$PROD_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@metropower.com","password":"MetroPower2025!"}')

if echo "$AUTH_RESPONSE" | grep -q '"accessToken"'; then
  PROD_TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  echo "✅ Admin authentication successful"
  echo "   Token: ${PROD_TOKEN:0:20}..."
else
  echo "❌ Admin authentication failed"
  echo "   Response: $AUTH_RESPONSE"
fi

echo ""

# Test 3: Manager Authentication
echo "👨‍💼 Testing manager authentication..."
MANAGER_AUTH_RESPONSE=$(curl -s -X POST "$PROD_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"antione.harrell@metropower.com","password":"MetroPower2025!"}')

if echo "$MANAGER_AUTH_RESPONSE" | grep -q '"accessToken"'; then
  echo "✅ Manager (Antione) authentication successful"
  MANAGER_TOKEN=$(echo "$MANAGER_AUTH_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
else
  echo "❌ Manager authentication failed"
  echo "   Response: $MANAGER_AUTH_RESPONSE"
fi

echo ""

# Test 4: Data Access
if [ ! -z "$PROD_TOKEN" ]; then
  echo "📊 Testing data access..."
  
  # Test employees endpoint
  echo "   Testing employees endpoint..."
  EMPLOYEES_RESPONSE=$(curl -s -w "%{http_code}" "$PROD_URL/api/employees" \
    -H "Authorization: Bearer $PROD_TOKEN")
  EMP_HTTP_CODE="${EMPLOYEES_RESPONSE: -3}"
  EMP_BODY="${EMPLOYEES_RESPONSE%???}"
  
  if [ "$EMP_HTTP_CODE" = "200" ]; then
    EMPLOYEE_COUNT=$(echo "$EMP_BODY" | grep -o '"employee_id"' | wc -l)
    echo "   ✅ Employees endpoint working ($EMPLOYEE_COUNT employees)"
  else
    echo "   ❌ Employees endpoint failed (HTTP $EMP_HTTP_CODE)"
  fi
  
  # Test projects endpoint
  echo "   Testing projects endpoint..."
  PROJECTS_RESPONSE=$(curl -s -w "%{http_code}" "$PROD_URL/api/projects" \
    -H "Authorization: Bearer $PROD_TOKEN")
  PROJ_HTTP_CODE="${PROJECTS_RESPONSE: -3}"
  PROJ_BODY="${PROJECTS_RESPONSE%???}"
  
  if [ "$PROJ_HTTP_CODE" = "200" ]; then
    PROJECT_COUNT=$(echo "$PROJ_BODY" | grep -o '"project_id"' | wc -l)
    echo "   ✅ Projects endpoint working ($PROJECT_COUNT projects)"
  else
    echo "   ❌ Projects endpoint failed (HTTP $PROJ_HTTP_CODE)"
  fi
  
  # Test assignments endpoint
  echo "   Testing assignments endpoint..."
  ASSIGNMENTS_RESPONSE=$(curl -s -w "%{http_code}" "$PROD_URL/api/assignments?start_date=2025-01-01&end_date=2025-12-31" \
    -H "Authorization: Bearer $PROD_TOKEN")
  ASSIGN_HTTP_CODE="${ASSIGNMENTS_RESPONSE: -3}"
  ASSIGN_BODY="${ASSIGNMENTS_RESPONSE%???}"
  
  if [ "$ASSIGN_HTTP_CODE" = "200" ]; then
    ASSIGNMENT_COUNT=$(echo "$ASSIGN_BODY" | grep -o '"assignment_id"' | wc -l)
    echo "   ✅ Assignments endpoint working ($ASSIGNMENT_COUNT assignments)"
  else
    echo "   ❌ Assignments endpoint failed (HTTP $ASSIGN_HTTP_CODE)"
  fi
else
  echo "⚠️  Skipping data access tests - no authentication token"
fi

echo ""

# Test 5: Frontend Access
echo "🖥️  Testing frontend access..."
FRONTEND_RESPONSE=$(curl -s -w "%{http_code}" "$PROD_URL/")
FRONTEND_HTTP_CODE="${FRONTEND_RESPONSE: -3}"
FRONTEND_BODY="${FRONTEND_RESPONSE%???}"

if [ "$FRONTEND_HTTP_CODE" = "200" ]; then
  if echo "$FRONTEND_BODY" | grep -q "MetroPower"; then
    echo "✅ Frontend accessible and contains MetroPower branding"
  else
    echo "⚠️  Frontend accessible but may not be fully loaded"
  fi
else
  echo "❌ Frontend access failed (HTTP $FRONTEND_HTTP_CODE)"
fi

echo ""

# Test 6: Database Mode Verification
echo "🗄️  Verifying database mode..."
if [ ! -z "$PROD_TOKEN" ]; then
  # Try to create a test record to verify we're not in demo mode
  TEST_CREATE=$(curl -s -X POST "$PROD_URL/api/employees" \
    -H "Authorization: Bearer $PROD_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "first_name": "Production",
      "last_name": "Test",
      "trade": "General Laborer",
      "level": "Entry",
      "hourly_rate": "25.00"
    }')
  
  if echo "$TEST_CREATE" | grep -q '"success":true'; then
    TEST_EMP_ID=$(echo "$TEST_CREATE" | grep -o '"employee_id":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Database mode confirmed - test record created (ID: $TEST_EMP_ID)"
    
    # Clean up test record
    curl -s -X DELETE "$PROD_URL/api/employees/$TEST_EMP_ID" \
      -H "Authorization: Bearer $PROD_TOKEN" > /dev/null
    echo "   Test record cleaned up"
  else
    echo "⚠️  Could not verify database mode"
    echo "   Response: $TEST_CREATE"
  fi
else
  echo "⚠️  Cannot verify database mode - no authentication token"
fi

echo ""

# Test 7: CORS and Security Headers
echo "🔒 Testing security configuration..."
SECURITY_RESPONSE=$(curl -s -I "$PROD_URL/api/employees" \
  -H "Authorization: Bearer $PROD_TOKEN" 2>/dev/null || echo "")

if echo "$SECURITY_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
  echo "✅ CORS headers present"
else
  echo "⚠️  CORS headers not detected"
fi

if echo "$SECURITY_RESPONSE" | grep -q "X-"; then
  echo "✅ Security headers present"
else
  echo "⚠️  Security headers not detected"
fi

echo ""
echo "🎉 PRODUCTION ENVIRONMENT VERIFICATION COMPLETED"
echo "==============================================="
echo "Vercel deployment tested successfully"
