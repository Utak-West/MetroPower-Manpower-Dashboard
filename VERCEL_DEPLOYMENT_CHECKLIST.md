# MetroPower Dashboard - Vercel Deployment Checklist

This document provides a step-by-step checklist for deploying the MetroPower Manpower Dashboard to Vercel with a Postgres database.

## Prerequisites

- [ ] Vercel account created and configured
- [ ] GitHub repository linked to Vercel
- [ ] Node.js 18+ installed locally
- [ ] Vercel CLI installed (`npm i -g vercel`)

## Pre-Deployment Steps

### Database Preparation

- [ ] Choose Vercel Postgres as your database provider
- [ ] Verify you have admin access to create database tables
- [ ] Prepare any required initial data (users, settings, etc.)

### Environment Variables

- [ ] Update JWT secrets (required for authentication)
  - `JWT_SECRET` - for access tokens
  - `JWT_REFRESH_SECRET` - for refresh tokens
- [ ] Configure any additional environment-specific variables
  - Email settings (if using notifications)
  - CORS origins
  - Company/branch information

## Deployment Process

### Option 1: Using the Provided Script

1. [ ] Make the deployment script executable:
   ```bash
   chmod +x deploy-to-vercel.sh
   ```

2. [ ] Run the deployment script:
   ```bash
   ./deploy-to-vercel.sh
   ```

3. [ ] Follow the prompts and provide necessary information

### Option 2: Manual Deployment

1. [ ] Link your local project to Vercel:
   ```bash
   vercel link
   ```

2. [ ] Add Postgres to your Vercel project:
   ```bash
   vercel integration add postgres
   ```

3. [ ] Pull environment variables:
   ```bash
   vercel env pull
   ```

4. [ ] Run database migrations:
   ```bash
   # Get your Postgres URL from .env after pulling env vars
   psql YOUR_POSTGRES_URL -f ./backend/src/migrations/001_create_tables.sql
   ```

5. [ ] Deploy to production:
   ```bash
   vercel --prod
   ```

## Post-Deployment Verification

- [ ] Verify the application is deployed and accessible
- [ ] Check `/api/health` endpoint to confirm database connection
- [ ] Test authentication with valid credentials
- [ ] Verify all dashboard functionality works correctly

## Initial User Setup

- [ ] Create an initial admin user if not automatically created
- [ ] Set up required company data (employees, projects, etc.)

## Troubleshooting Common Issues

### Database Connection Issues

If you encounter database connection errors:

1. [ ] Verify Vercel Postgres is properly provisioned in your project
2. [ ] Check environment variables are correctly set in Vercel dashboard
3. [ ] Ensure the database migration was successful
4. [ ] Check logs in Vercel dashboard for any specific errors

### Authentication Issues

If users cannot login:

1. [ ] Verify JWT secrets are properly set in environment variables
2. [ ] Ensure the database contains valid user records
3. [ ] Check request/response in browser developer tools for any errors

## Maintenance

- [ ] Set up a regular database backup strategy
- [ ] Configure monitoring and alerts (Vercel provides some monitoring)
- [ ] Plan for future updates and migrations

---

For additional deployment information, refer to the [Vercel documentation](https://vercel.com/docs) and the [Vercel Postgres documentation](https://vercel.com/docs/storage/vercel-postgres).
