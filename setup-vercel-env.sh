#!/bin/bash

echo "🔧 Setting up Vercel Environment Variables"
echo "=========================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "Setting environment variables for production..."

# Database Configuration
vercel env add POSTGRES_URL production
echo "postgres://neondb_owner:npg_FIzeB8CoU3tM@ep-small-wildflower-a4s9we42-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

vercel env add POSTGRES_PRISMA_URL production  
echo "postgres://neondb_owner:npg_FIzeB8CoU3tM@ep-small-wildflower-a4s9we42-pooler.us-east-1.aws.neon.tech/neondb?pgbouncer=true&connect_timeout=15"

vercel env add POSTGRES_URL_NON_POOLING production
echo "postgres://neondb_owner:npg_FIzeB8CoU3tM@ep-small-wildflower-a4s9we42-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

vercel env add POSTGRES_USER production
echo "neondb_owner"

vercel env add POSTGRES_HOST production
echo "ep-small-wildflower-a4s9we42-pooler.us-east-1.aws.neon.tech"

vercel env add POSTGRES_PASSWORD production
echo "npg_FIzeB8CoU3tM"

vercel env add POSTGRES_DATABASE production
echo "neondb"

# Application Configuration
vercel env add NODE_ENV production
echo "production"

vercel env add DEMO_MODE_ENABLED production
echo "false"

vercel env add USE_MEMORY_DB production
echo "false"

# JWT Configuration
vercel env add JWT_SECRET production
echo "metropower-jwt-secret-key-2025-very-secure-32-chars-minimum"

vercel env add JWT_REFRESH_SECRET production
echo "metropower-refresh-secret-key-2025-very-secure-32-chars-minimum"

vercel env add JWT_EXPIRES_IN production
echo "24h"

vercel env add JWT_REFRESH_EXPIRES_IN production
echo "7d"

vercel env add JWT_ISSUER production
echo "MetroPower Dashboard"

# Other Configuration
vercel env add BCRYPT_ROUNDS production
echo "12"

vercel env add FROM_EMAIL production
echo "noreply@metropower.com"

echo ""
echo "✅ Environment variables set up!"
echo "Now redeploy with: vercel --prod"
