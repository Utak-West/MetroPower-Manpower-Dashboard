# MetroPower Dashboard - Authentication Troubleshooting Guide

## Current Issue: HTTP 500 Login Error

Based on the screenshot showing "HTTP 500" error during login, here's a comprehensive troubleshooting guide.

## 🔍 Step-by-Step Debugging

### Step 1: Check Debug Endpoint

First, visit the debug endpoint to diagnose the issue:

```
https://your-vercel-domain.vercel.app/api/debug
```

This will show you:
- Environment variable status
- Database connection status
- Table existence
- User count
- JWT configuration

### Step 2: Check Environment Variables in Vercel

Go to your Vercel project dashboard → Settings → Environment Variables and ensure these are set:

**Required Variables:**
```
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_SSL=true
JWT_SECRET=your-super-secure-jwt-secret-32-chars-minimum
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-32-chars-minimum
NODE_ENV=production
```

**Optional but Recommended:**
```
CORS_ORIGIN=https://your-vercel-domain.vercel.app
WEBSOCKET_CORS_ORIGIN=https://your-vercel-domain.vercel.app
```

### Step 3: Initialize Database (If Needed)

If the debug endpoint shows no tables, initialize the database:

```bash
curl -X POST https://your-vercel-domain.vercel.app/api/debug/init-db
```

### Step 4: Test Authentication

Test the login functionality directly:

```bash
curl -X POST https://your-vercel-domain.vercel.app/api/debug/test-login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "admin@metropower.com", "password": "MetroPower2025!"}'
```

## 🛠️ Common Issues & Solutions

### Issue 1: Database Connection Failed

**Symptoms:** Debug endpoint shows database connection error

**Solutions:**
1. Verify database credentials in Vercel environment variables
2. Ensure database allows connections from Vercel's IP ranges
3. Check if database SSL is properly configured
4. Try connecting to database from local machine with same credentials

### Issue 2: Tables Don't Exist

**Symptoms:** Debug endpoint shows 0 tables

**Solutions:**
1. Run the database initialization endpoint: `/api/debug/init-db`
2. Manually run migrations in your database:
   ```sql
   -- Copy content from backend/src/migrations/001_create_tables.sql
   ```

### Issue 3: No Users in Database

**Symptoms:** Debug endpoint shows 0 users

**Solutions:**
1. Run the database initialization endpoint (includes seeding)
2. Manually create admin user:
   ```sql
   INSERT INTO users (username, email, password_hash, first_name, last_name, role)
   VALUES ('admin', 'admin@metropower.com', '$2a$12$hash...', 'System', 'Administrator', 'Admin');
   ```

### Issue 4: JWT Configuration Issues

**Symptoms:** JWT secret length is 0 or very short

**Solutions:**
1. Generate secure JWT secrets (32+ characters):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Set both `JWT_SECRET` and `JWT_REFRESH_SECRET` in Vercel

### Issue 5: CORS Issues

**Symptoms:** Browser console shows CORS errors

**Solutions:**
1. Set `CORS_ORIGIN` to your Vercel domain
2. Ensure no trailing slashes in the domain

## 🔧 Quick Fixes

### Fix 1: Redeploy with Correct Environment Variables

1. Set all required environment variables in Vercel
2. Redeploy the application
3. Test the debug endpoint

### Fix 2: Manual Database Setup

If automatic initialization fails:

1. Connect to your database directly
2. Run the migration SQL manually
3. Create admin user manually
4. Test login

### Fix 3: Use Alternative Database

If current database has issues:

1. Create new Supabase project
2. Update environment variables
3. Redeploy and initialize

## 📋 Default Credentials

After successful database initialization, use these credentials:

**Admin User:**
- Email: `admin@metropower.com`
- Password: `MetroPower2025!`

**Antoine Harrell (Project Manager):**
- Email: `antoine.harrell@metropower.com`
- Password: `MetroPower2025!`

## 🔍 Browser Console Debugging

Open browser developer tools and check:

1. **Network Tab:** Look for failed API requests
2. **Console Tab:** Check for JavaScript errors
3. **Application Tab:** Check localStorage for tokens

## 📞 Getting Help

If issues persist:

1. Check Vercel function logs in dashboard
2. Run debug endpoints and share results
3. Verify database connectivity independently
4. Contact development team with:
   - Debug endpoint output
   - Vercel function logs
   - Browser console errors
   - Database connection details

## 🎯 Success Indicators

You'll know authentication is working when:

1. Debug endpoint shows all green checks
2. Login returns access token
3. Dashboard loads without login modal
4. No 500 errors in browser network tab

## 🔄 Next Steps After Fix

1. Test all dashboard functionality
2. Verify real-time updates work
3. Test export features
4. Set up monitoring and alerts
5. Configure custom domain (optional)
