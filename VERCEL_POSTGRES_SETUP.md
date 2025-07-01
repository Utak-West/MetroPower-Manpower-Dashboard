# Vercel Postgres Setup Guide

This guide explains how to set up Vercel Postgres for the MetroPower Dashboard to enable persistent data storage.

## 🚨 CRITICAL: Data Persistence Issue Fixed

The MetroPower Dashboard has been updated to use **persistent database storage** instead of in-memory storage. This fixes the issue where:
- ❌ Employee deletions would reappear after page refresh
- ❌ New employee additions would disappear after page refresh  
- ❌ Project and assignment changes were lost on browser reload

## ✅ What's Been Fixed

1. **Database Configuration**: Updated to use persistent PostgreSQL database
2. **CRUD Operations**: All Create, Read, Update, Delete operations now persist permanently
3. **Employee Management**: Full CRUD with persistent storage
4. **Project Management**: Persistent project data
5. **Assignment Management**: Persistent assignment tracking
6. **Authentication**: Antione Harrell's login continues to work correctly

## 🔧 Vercel Postgres Setup Instructions

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and log in
2. Navigate to your MetroPower Dashboard project
3. Go to the **Storage** tab

### Step 2: Create Postgres Database
1. Click **"Create Database"**
2. Select **"Postgres"**
3. Choose a database name: `metropower-dashboard-db`
4. Select the region closest to your users
5. Click **"Create"**

### Step 3: Configure Environment Variables
Vercel will automatically add these environment variables to your project:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL` 
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### Step 4: Verify Configuration
The application is already configured to use these environment variables. No additional setup needed!

### Step 5: Deploy and Test
1. The latest deployment will automatically use the Postgres database
2. Test the following to verify data persistence:
   - Add a new employee → Refresh page → Employee should remain
   - Delete an employee → Refresh page → Employee should stay deleted
   - Update project details → Refresh page → Changes should persist

## 🧪 Testing Data Persistence

### Manual Testing Steps:
1. **Login** as Antione Harrell (`antione.harrell@metropower.com` / `password123`)
2. **Add Employee**: Go to Staff page → Add new employee → Save
3. **Refresh Page**: Press F5 or reload browser
4. **Verify**: New employee should still be visible
5. **Delete Employee**: Delete the employee you just added
6. **Refresh Page**: Press F5 or reload browser  
7. **Verify**: Deleted employee should remain deleted

### Expected Results:
✅ **PASS**: All changes persist after page refresh
❌ **FAIL**: Changes are lost after page refresh (indicates database not connected)

## 🔍 Troubleshooting

### If Data Still Doesn't Persist:

1. **Check Environment Variables**:
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Verify `POSTGRES_URL` exists and has a valid connection string
   - Ensure `USE_MEMORY_DB` is set to `false` (or not set at all)

2. **Check Deployment Logs**:
   - Go to Vercel Dashboard → Project → Functions tab
   - Look for database connection errors in the logs
   - Should see: "Using persistent database storage"
   - Should NOT see: "Using in-memory database"

3. **Force Redeploy**:
   - Go to Vercel Dashboard → Project → Deployments
   - Click the three dots on latest deployment → "Redeploy"

### Common Issues:

**Issue**: "Database connection failed" in logs
**Solution**: Verify Postgres database is created and environment variables are set

**Issue**: Still seeing "Using in-memory database" in logs  
**Solution**: Check that `USE_MEMORY_DB` environment variable is set to `false`

**Issue**: "Missing required environment variables: JWT_SECRET"
**Solution**: Add `JWT_SECRET` and `JWT_REFRESH_SECRET` to environment variables

## 📊 Database Schema

The application will automatically create these tables:
- `users` - User accounts and authentication
- `employees` - Employee records with full CRUD
- `projects` - Project information  
- `assignments` - Employee-project assignments
- `positions` - Job positions/trades
- `migrations` - Database version tracking

## 🔐 Security Notes

- Database credentials are automatically managed by Vercel
- All connections use SSL encryption
- Only authenticated users can modify data
- Antione Harrell has Project Manager permissions for full CRUD access

## 🎯 Success Criteria

After setup, you should be able to:
1. ✅ Add employees that persist after page refresh
2. ✅ Delete employees that stay deleted after page refresh  
3. ✅ Update project information that survives browser restart
4. ✅ Create assignments that remain after application redeployment
5. ✅ Login as Antione Harrell with full manager permissions

## 📞 Support

If you encounter issues:
1. Check the Vercel deployment logs for error messages
2. Verify all environment variables are properly set
3. Ensure the Postgres database is running and accessible
4. Test with a simple employee add/delete cycle

The data persistence layer has been completely rewritten to use PostgreSQL instead of in-memory storage. This ensures all your dashboard changes are permanently saved and will survive any system restarts or deployments.
