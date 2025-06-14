#!/bin/bash
# MetroPower Dashboard - Automated Vercel Deployment Script
# ---------------------------------------------------------
# This script automates the deployment of the MetroPower Dashboard to Vercel,
# including Vercel project linking, environment setup, Postgres integration,
# and database migrations.
#
# Prerequisites:
#   - Vercel CLI: Will be installed if not found.
#   - Node.js & npm: For Vercel CLI installation.
#   - psql: PostgreSQL client tools for database migrations (will prompt if not found).
#   - .env.example: Must exist in the current directory.
#
# Usage:
#   ./deploy-to-vercel.sh
#
# Make sure to review and update your .env file when prompted.
# ---------------------------------------------------------

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

# Check if user is logged into Vercel
if ! vercel whoami &> /dev/null; then
  echo "❌ You are not logged into Vercel. Please run 'vercel login' and then re-run this script."
  exit 1
fi

# Check for required environment variables
echo "📋 Checking for required environment variables..."
if [ -f .env ]; then
  echo "✅ .env file found"
else
  echo "⚠️  .env file not found, creating from example..."
  cp .env.example .env
  echo "⚠️  Please edit .env file with your actual values before continuing"
  echo "🔄 Please ensure the following variables are set in .env:"
  echo "   - POSTGRES_URL (if you intend to run migrations locally or if not yet set in Vercel)"
  echo "   - Any other critical variables required by your Vercel project."
  echo "Press Enter to continue once you've updated .env, or Ctrl+C to cancel."
  read -r
fi

# Check for essential variables in .env before linking
if [ -f .env ]; then
  if ! grep -q "POSTGRES_URL=" .env || ! grep -q "JWT_SECRET=" .env; then # Add other essential vars if known
    echo "⚠️  Essential variables like POSTGRES_URL or JWT_SECRET seem to be missing or empty in your .env file."
    echo "   This might cause issues with Vercel linking or deployment."
    echo "   Press Enter to attempt to continue, or Ctrl+C to edit .env and restart."
    read -r
  fi
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
echo "If you are prompted to set up Postgres (e.g., choose a project, region, or link an existing DB),"
echo "please follow the Vercel prompts carefully."
echo "This script will attempt to add the Vercel Postgres integration."
echo ""
vercel integration add postgres

# Initialize database schema/migrations
echo ""
echo "🔧 Setting up database schema..."
echo "Select an option:"
echo "1) Run initial database migration"
echo "2) Skip database migration (if you've already set up the schema)"

while true; do
  read -p "Select option (1 for migration, 2 to skip): " DB_OPTION
  case $DB_OPTION in
    [12]) break;;
    *) echo "Invalid input. Please enter 1 or 2.";;
  esac
done

if [ "$DB_OPTION" = "1" ]; then
  echo "📦 Running database migrations..."
  
  # Get the Postgres URL from Vercel env
  POSTGRES_URL=$(grep -E 'POSTGRES_URL=' .env | cut -d '=' -f2-)
  
  if [ -z "$POSTGRES_URL" ]; then
    echo "❌ Could not find POSTGRES_URL in .env file"
    echo "Please run 'vercel env pull' to update your .env file"
    exit 1
  fi

  if [[ ! "$POSTGRES_URL" =~ ^postgres://.+:.+@.+:.+/.+ ]]; then
    echo "❌ POSTGRES_URL in .env does not seem to be a valid PostgreSQL connection string."
    echo "   It should look like: postgres://user:password@host:port/database"
    echo "   Please correct it in .env (you might need to run 'vercel env pull' again if it's from Vercel)."
    exit 1
  fi
  
  echo "Found database URL, running migrations..."
  
  # Check for migration file
  MIGRATION_FILE="./backend/src/migrations/001_create_tables.sql"
  if [ -f "$MIGRATION_FILE" ]; then
    echo "Found migration file at $MIGRATION_FILE"
    
    # Check for psql client
    if ! command -v psql &> /dev/null; then
      echo "❌ PostgreSQL client (psql) not found."
      echo "   Please install PostgreSQL client tools."
      echo "   Common installation commands:"
      echo "     - Ubuntu/Debian: sudo apt-get update && sudo apt-get install postgresql-client"
      echo "     - macOS (Homebrew): brew install libpq"
      echo "     - Windows: Install the PostgreSQL installer from postgresql.org, ensuring 'Command Line Tools' are included."
      echo "   After installation, ensure 'psql' is in your PATH and re-run the script."
      exit 1
    fi
    
    # Run migration using psql
    # Temporarily disable set -e for this command to check its exit status
    set +e
    PGPASSWORD=$(echo "$POSTGRES_URL" | grep -oP '://[^:]+:\K[^@]+') psql "$POSTGRES_URL" -f "$MIGRATION_FILE" -v ON_ERROR_STOP=1
    PSQL_EXIT_CODE=$?
    set -e # Re-enable set -e

    if [ $PSQL_EXIT_CODE -eq 0 ]; then
      echo "✅ Database migration completed successfully."
    else
      echo "❌ Database migration failed with exit code $PSQL_EXIT_CODE."
      echo "   Please check the output above for errors from psql."
      echo "   You might need to resolve issues with the migration file ($MIGRATION_FILE) or database connection."
      exit 1
    fi
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
