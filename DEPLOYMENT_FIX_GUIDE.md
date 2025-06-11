# MetroPower Dashboard - Deployment Fix Guide

## 🚨 **Current Issues & Solutions**

### Issue 1: 404 NOT_FOUND Errors
**Root Cause:** Vercel routing configuration problems
**Status:** ✅ FIXED - Updated vercel.json with correct routing

### Issue 2: Database Configuration Missing
**Root Cause:** Missing environment variables in Vercel
**Status:** 🔧 NEEDS SETUP - Follow steps below

### Issue 3: Authentication HTTP 500 Errors
**Root Cause:** Database connection and JWT configuration issues
**Status:** 🔧 WILL BE FIXED - After database setup

## 🔧 **Step-by-Step Fix Instructions**

### Step 1: Set Up Database (CRITICAL)

You need a PostgreSQL database. **Recommended: Supabase (free tier)**

#### Option A: Supabase Setup (Recommended)
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for database to initialize
4. Go to Settings → Database
5. Copy connection details

#### Option B: Other PostgreSQL Providers
- **Neon**: [neon.tech](https://neon.tech)
- **PlanetScale**: [planetscale.com](https://planetscale.com)
- **Railway**: [railway.app](https://railway.app)

### Step 2: Configure Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables

**Add these REQUIRED variables:**

```env
# Database Configuration (REQUIRED)
DB_HOST=your-database-host-from-supabase
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-database-password-from-supabase
DB_SSL=true

# JWT Secrets (REQUIRED - Generate secure 32+ character strings)
JWT_SECRET=your-super-secure-jwt-secret-32-chars-minimum
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-32-chars-minimum

# Application Settings
NODE_ENV=production
CORS_ORIGIN=https://your-vercel-domain.vercel.app
WEBSOCKET_CORS_ORIGIN=https://your-vercel-domain.vercel.app
```

**Generate JWT Secrets:**
```bash
# Run this in terminal to generate secure secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Redeploy Application

1. After setting environment variables in Vercel
2. Go to Deployments tab
3. Click "Redeploy" on latest deployment
4. Wait for deployment to complete

### Step 4: Initialize Database

After successful deployment, visit:
```
https://your-vercel-domain.vercel.app/api/debug/init-db
```

This will:
- Create all required tables
- Seed initial data including users
- Set up default admin account

### Step 5: Test the Deployment

1. **Check system status:**
   ```
   https://your-vercel-domain.vercel.app/api/debug
   ```

2. **Test authentication:**
   ```
   https://your-vercel-domain.vercel.app/api/debug/test-login
   ```

3. **Access dashboard:**
   ```
   https://your-vercel-domain.vercel.app/
   ```

## 🔑 **Default Login Credentials**

After database initialization:

**Admin User:**
- Email: `admin@metropower.com`
- Password: `MetroPower2025!`

**Antoine Harrell (Project Manager):**
- Email: `antoine.harrell@metropower.com`
- Password: `MetroPower2025!`

## 🎯 **Success Checklist**

- [ ] Environment variables set in Vercel
- [ ] Application redeployed successfully
- [ ] `/api/debug` shows all green checks
- [ ] Database initialized with `/api/debug/init-db`
- [ ] Login works without HTTP 500 errors
- [ ] Dashboard loads and displays data

## 🚨 **If Still Getting 404 Errors**

1. **Check Vercel Function Logs:**
   - Go to Vercel dashboard → Functions tab
   - Look for error messages

2. **Verify Domain:**
   - Ensure you're using the correct Vercel domain
   - Check if custom domain is properly configured

3. **Clear Browser Cache:**
   - Hard refresh (Ctrl+F5 or Cmd+Shift+R)
   - Try incognito/private browsing mode

## 📞 **Getting Help**

If issues persist, share:
1. Output from `/api/debug` endpoint
2. Vercel function logs
3. Browser console errors
4. Environment variables list (without values)

## 🎨 **Next: UI Enhancements**

After deployment is working, we'll add:
- MetroPower logo to header
- Professional user avatar
- Enhanced styling and branding
