# MetroPower Dashboard - Deployment Troubleshooting Guide

## HTTP 500 Login Error - Quick Fix Guide

If you're experiencing HTTP 500 errors when trying to log in, follow these steps to diagnose and fix the issue.

## Step 1: Check Debug Endpoint

Visit the debug endpoint to see what's wrong:

```
https://your-vercel-domain.vercel.app/api/debug
```

This will show you:
- Environment variables status
- Database connection status
- Number of tables and users
- JWT configuration

## Step 2: Common Issues and Solutions

### Issue 1: Missing Environment Variables

**Symptoms:** Debug shows missing DB_HOST, JWT_SECRET, etc.

**Solution:** Add these environment variables in Vercel dashboard:

**Required Variables:**
```
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_SSL=true
JWT_SECRET=your-32-character-secret-here
JWT_REFRESH_SECRET=your-32-character-refresh-secret
```

**Generate JWT Secrets:**
```bash
# Run this in terminal to generate secure secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Issue 2: Database Not Connected

**Symptoms:** Debug shows database connection error

**Solutions:**
1. Verify database credentials are correct
2. Ensure database allows connections from Vercel IPs
3. Check if database requires SSL (set DB_SSL=true)
4. Try connecting from local machine with same credentials

### Issue 3: No Tables in Database

**Symptoms:** Debug shows 0 tables

**Solution:** Initialize the database:
```
POST https://your-vercel-domain.vercel.app/api/debug/init-db
```

### Issue 4: No Users in Database

**Symptoms:** Debug shows 0 users

**Solution:** The init-db endpoint above will also create default users.

**Default Credentials:**
- Email: admin@metropower.com
- Password: MetroPower2025!

## Step 3: Test Login

After fixing environment variables and database:

```
POST https://your-vercel-domain.vercel.app/api/debug/test-login
```

## Step 4: Redeploy

After making changes to environment variables:
1. Go to Vercel dashboard
2. Go to your project
3. Click "Redeploy" on the latest deployment

## Step 5: Check Frontend Assets

If login works but assets don't load:

1. Check that images exist in `/frontend/assets/images/`
2. Verify Vercel routing in `vercel.json`
3. Check browser console for 404 errors

## Quick Database Setup (Supabase)

If you need a database:

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings > Database
4. Copy connection details to Vercel environment variables

## Environment Variables Checklist

In Vercel dashboard, ensure these are set:

- [ ] DB_HOST
- [ ] DB_PORT (usually 5432)
- [ ] DB_NAME
- [ ] DB_USER
- [ ] DB_PASSWORD
- [ ] DB_SSL (set to true for cloud databases)
- [ ] JWT_SECRET (32+ characters)
- [ ] JWT_REFRESH_SECRET (32+ characters)
- [ ] NODE_ENV (set to production)

## Demo Mode

If you want to bypass login issues temporarily:
- Demo mode is enabled by default
- Click "Enter Demo Mode as Antione Harrell" on login screen
- This works without database connection

## Getting Help

1. Check debug endpoint first: `/api/debug`
2. Check Vercel function logs in dashboard
3. Verify all environment variables are set
4. Try demo mode to test frontend functionality

## Common Error Messages

**"Authentication required"** = Missing JWT_SECRET
**"Database connection failed"** = Wrong DB credentials
**"Invalid credentials"** = User doesn't exist (run init-db)
**"HTTP 500"** = Check debug endpoint for specific error

## Contact Support

If issues persist after following this guide:
1. Share the output from `/api/debug` endpoint
2. Check Vercel function logs for detailed errors
3. Verify environment variables are correctly set
