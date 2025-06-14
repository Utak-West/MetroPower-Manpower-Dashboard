#!/bin/bash
# MetroPower Dashboard - Automated Vercel Deployment Script
# This script automates the deployment process to Vercel with Postgres

# Set error handling
set -e
echo "🚀 MetroPower Dashboard - Vercel Deployment Script"
echo "=================================================="
echo ""

# Check for Vercel CLI
if ! command -v vercel &> /dev/null; then
  echo "❌ Vercel CLI not found! Installing..."
  npm install -g vercel
fi

# Check for required environment variables
echo "📋 Checking for required environment variables..."
if [ -f .env ]; then
  echo "✅ .env file found"
else
  echo "⚠️  .env file not found, creating from example..."
  cp .env.example .env
  echo "⚠️  Please edit .env file with your actual values before continuing"
  echo "   Press Enter to continue once you've set the required values, or Ctrl+C to cancel"
  read -r
fi

# Link to Vercel project if not already linked
echo "🔗 Linking to Vercel project..."
if [ ! -d ".vercel" ]; then
  echo "Running vercel link..."
  vercel link
else
  echo "✅ Project already linked to Vercel"
fi

# Pull environment variables from Vercel
echo "⬇️  Pulling environment variables from Vercel..."
vercel env pull

# Add Postgres integration if not already added
echo ""
echo "🔍 Checking for Postgres integration..."
echo "If you are prompted to set up Postgres, follow the prompts"
echo ""
vercel integration add postgres

# Initialize database schema/migrations
echo ""
echo "🔧 Setting up database schema..."
echo "Select an option:"
echo "1) Run initial database migration"
echo "2) Skip database migration (if you've already set up the schema)"
read -p "Select option (1/2): " DB_OPTION

if [ "$DB_OPTION" = "1" ]; then
  echo "📦 Running database migrations..."
  
  # Get the Postgres URL from Vercel env
  POSTGRES_URL=$(grep -E 'POSTGRES_URL=' .env | cut -d '=' -f2-)
  
  if [ -z "$POSTGRES_URL" ]; then
    echo "❌ Could not find POSTGRES_URL in .env file"
    echo "Please run 'vercel env pull' to update your .env file"
    exit 1
  fi
  
  echo "Found database URL, running migrations..."
  
  # Check for migration file
  MIGRATION_FILE="./backend/src/migrations/001_create_tables.sql"
  if [ -f "$MIGRATION_FILE" ]; then
    echo "Found migration file at $MIGRATION_FILE"
    
    # Install pg client if not present
    if ! command -v psql &> /dev/null; then
      echo "PostgreSQL client not found. Please install PostgreSQL CLI tools."
      exit 1
    fi
    
    # Run migration using psql
    PGPASSWORD=$(echo $POSTGRES_URL | grep -oP '://[^:]+:\K[^@]+') psql "$POSTGRES_URL" -f "$MIGRATION_FILE"
    echo "✅ Database migration completed"
  else
    echo "❌ Migration file not found at $MIGRATION_FILE"
    echo "Please run migrations manually"
  fi
else
  echo "Skipping database migration..."
fi

# Deploy the project to Vercel
echo ""
echo "🚀 Deploying project to Vercel..."
vercel --prod

echo ""
echo "✨ Deployment completed!"
echo "=================================================="
echo "🌐 Your MetroPower Dashboard should now be live!"
echo "📝 Check the Vercel dashboard for your deployment URL and status"
echo ""
echo "📊 To verify database setup, visit YOUR-DEPLOYMENT-URL/api/health"
echo "🔑 To access the dashboard, visit YOUR-DEPLOYMENT-URL and login"
echo "=================================================="
