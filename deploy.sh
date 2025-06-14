#!/bin/bash

# MetroPower Manpower Dashboard - Deployment Script
# This script sets up and deploys the complete dashboard system

set -e

echo "🚀 MetroPower Manpower Dashboard Deployment"
echo "============================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p backend/exports
mkdir -p frontend/assets/images

# Copy environment file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating environment file..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env with your configuration before running the application"
fi

# Build and start the application
echo "🔨 Building and starting the application..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Dashboard: http://localhost:8080"
    echo "   API: http://localhost:3001"
    echo "   API Docs: http://localhost:3001/api-docs"
    echo "   Health Check: http://localhost:3001/health"
    echo ""
    echo "🔐 Default Login Credentials:"
    echo "   Admin: admin@metropower.com / MetroPower2025!"
    echo "   Project Manager: antoine.harrell@metropower.com / MetroPower2025!"
    echo ""
    echo "📊 To view logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 To stop the application:"
    echo "   docker-compose down"
else
    echo "❌ Some services failed to start. Check logs with:"
    echo "   docker-compose logs"
    exit 1
fi
