#!/bin/bash

# MetroPower Manpower Dashboard - Server Startup Script
# This script starts the backend server with the correct environment variables

echo "🚀 Starting MetroPower Manpower Dashboard Server..."
echo "📍 Location: Tucker Branch"
echo "🏢 Company: MetroPower"
echo ""

# Navigate to backend directory
cd backend

# Set environment variables and start server
export USE_MEMORY_DB=true
export LOG_LEVEL=info
export NODE_ENV=development

echo "✅ Using in-memory database (no PostgreSQL required)"
echo "✅ Environment: $NODE_ENV"
echo "✅ Log Level: $LOG_LEVEL"
echo ""

echo "🔧 Starting server on http://localhost:3001"
echo "🌐 Frontend available at: file://$(pwd)/../frontend/index.html"
echo ""
echo "📋 Demo Login Credentials:"
echo "   Admin: admin@metropower.com / MetroPower2025!"
echo "   Manager: antione.harrell@metropower.com / password123"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo "----------------------------------------"

# Start the server
node server.js
