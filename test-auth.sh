#!/bin/bash

BASE_URL="http://localhost:3001"

echo "🔐 Testing Authentication System..."
echo ""

# Test Admin User Login
echo "Testing login for Admin User (admin@metropower.com)..."
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@metropower.com","password":"MetroPower2025!"}')

echo "Admin login response: $ADMIN_RESPONSE"

if echo "$ADMIN_RESPONSE" | grep -q '"accessToken"'; then
  echo "✅ Admin login successful"
  ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  echo "Admin token extracted: ${ADMIN_TOKEN:0:20}..."
  
  # Test protected route with admin token
  echo "Testing protected route access with admin token..."
  PROTECTED_RESPONSE=$(curl -s -X GET "$BASE_URL/api/employees" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
  if echo "$PROTECTED_RESPONSE" | grep -q -v '"error"'; then
    echo "✅ Admin protected route access successful"
  else
    echo "❌ Admin protected route access failed"
    echo "Response: $PROTECTED_RESPONSE"
  fi
else
  echo "❌ Admin login failed"
fi

echo ""

# Test Manager User Login
echo "Testing login for Manager User (antione.harrell@metropower.com)..."
MANAGER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"antione.harrell@metropower.com","password":"MetroPower2025!"}')

echo "Manager login response: $MANAGER_RESPONSE"

if echo "$MANAGER_RESPONSE" | grep -q '"accessToken"'; then
  echo "✅ Manager login successful"
  MANAGER_TOKEN=$(echo "$MANAGER_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  echo "Manager token extracted: ${MANAGER_TOKEN:0:20}..."
  
  # Test protected route with manager token
  echo "Testing protected route access with manager token..."
  PROTECTED_RESPONSE=$(curl -s -X GET "$BASE_URL/api/employees" \
    -H "Authorization: Bearer $MANAGER_TOKEN")
  
  if echo "$PROTECTED_RESPONSE" | grep -q -v '"error"'; then
    echo "✅ Manager protected route access successful"
  else
    echo "❌ Manager protected route access failed"
    echo "Response: $PROTECTED_RESPONSE"
  fi
else
  echo "❌ Manager login failed"
fi

echo ""

# Test Invalid Credentials
echo "Testing invalid credentials..."
INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"invalid@email.com","password":"wrongpassword"}')

if echo "$INVALID_RESPONSE" | grep -q '"error"'; then
  echo "✅ Invalid credentials properly rejected"
else
  echo "❌ Invalid credentials test failed"
  echo "Response: $INVALID_RESPONSE"
fi

echo ""
echo "🔐 Authentication testing completed"
