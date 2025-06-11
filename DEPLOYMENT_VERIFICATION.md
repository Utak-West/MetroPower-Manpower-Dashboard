# MetroPower Dashboard - Deployment Verification Guide

## Issue 1: FIXED - Deployment Accessibility (404 NOT_FOUND)

### Problem Identified
The Vercel configuration had incorrect build patterns that prevented proper function deployment.

### Solution Applied
Updated `vercel.json` with correct build configuration:
- Changed `"src": "api/**/*.js"` to specific file builds
- Fixed routing order for static assets
- Corrected favicon routing

### Verification Steps
1. **Check Vercel Build Logs**
   - Go to Vercel Dashboard → Deployments
   - Click on latest deployment
   - Verify both `api/index.js` and `api/debug.js` are built successfully

2. **Test Basic Endpoints**
   ```bash
   # Test health endpoint
   curl https://your-vercel-domain.vercel.app/api/debug/health
   
   # Should return:
   # {"status":"OK","timestamp":"...","service":"MetroPower Debug API"}
   ```

3. **Test Static File Serving**
   ```bash
   # Test main page
   curl -I https://your-vercel-domain.vercel.app/
   
   # Should return HTTP 200
   ```

## Issue 2: Authentication System Fix

### Required Environment Variables in Vercel

Go to Vercel Dashboard → Settings → Environment Variables and add:

```env
# Database Configuration (REQUIRED)
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_SSL=true

# JWT Secrets (REQUIRED - Generate 32+ character strings)
JWT_SECRET=your-super-secure-jwt-secret-32-chars-minimum
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-32-chars-minimum

# Application Settings
NODE_ENV=production
CORS_ORIGIN=https://your-vercel-domain.vercel.app
```

### Generate JWT Secrets
```bash
# Run these commands to generate secure secrets:
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Database Setup Options

#### Option A: Supabase (Recommended - Free Tier)
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for initialization
4. Go to Settings → Database
5. Copy connection details:
   - Host: `db.xxx.supabase.co`
   - Database: `postgres`
   - User: `postgres`
   - Password: (your chosen password)
   - Port: `5432`

#### Option B: Other PostgreSQL Providers
- **Neon**: [neon.tech](https://neon.tech) (Free tier available)
- **Railway**: [railway.app](https://railway.app) (Free tier available)
- **PlanetScale**: [planetscale.com](https://planetscale.com) (MySQL compatible)

### Authentication Fix Steps

1. **Set Environment Variables**
   - Add all required variables in Vercel dashboard
   - Ensure JWT secrets are 32+ characters

2. **Redeploy Application**
   - Go to Vercel Dashboard → Deployments
   - Click "Redeploy" on latest deployment

3. **Check System Status**
   ```bash
   curl https://your-vercel-domain.vercel.app/api/debug
   ```
   
   Look for:
   - `env_vars`: All should be `true`
   - `database_connection`: Should show `"status": "success"`
   - `tables`: Should show table count > 0

4. **Initialize Database (if needed)**
   ```bash
   curl -X POST https://your-vercel-domain.vercel.app/api/debug/init-db
   ```

5. **Test Login**
   ```bash
   curl -X POST https://your-vercel-domain.vercel.app/api/debug/test-login \
     -H "Content-Type: application/json" \
     -d '{"identifier": "admin@metropower.com", "password": "MetroPower2025!"}'
   ```

### Default Login Credentials
After database initialization:
- **Email**: `admin@metropower.com`
- **Password**: `MetroPower2025!`

## Issue 3: Logo Display Fix

### Problem
The MetroPower logo may not display due to routing or file path issues.

### Solution Applied
1. **Fixed Vercel Routing**
   - Updated asset routing in `vercel.json`
   - Ensured proper static file serving

2. **Verified File Structure**
   - Logo exists at: `frontend/assets/images/metropower-logo.svg`
   - HTML references: `assets/images/metropower-logo.svg`

### Verification Steps
1. **Test Logo URL Directly**
   ```bash
   curl -I https://your-vercel-domain.vercel.app/assets/images/metropower-logo.svg
   ```
   Should return HTTP 200

2. **Check Browser Network Tab**
   - Open dashboard in browser
   - Press F12 → Network tab
   - Look for logo request
   - Should not show 404 errors

3. **Verify HTML Reference**
   The logo should appear in the header with proper styling.

## Issue 4: Documentation Cleanup (Emoji Removal)

This will be addressed in a separate update to maintain corporate documentation standards.

## Complete Verification Checklist

### Pre-Deployment
- [ ] Environment variables set in Vercel
- [ ] Database created and accessible
- [ ] JWT secrets generated (32+ characters)

### Post-Deployment
- [ ] Health endpoint responds: `/api/debug/health`
- [ ] Debug endpoint shows all green: `/api/debug`
- [ ] Database initialized: `/api/debug/init-db`
- [ ] Login test passes: `/api/debug/test-login`
- [ ] Main page loads: `/`
- [ ] Logo displays correctly
- [ ] Static assets load (CSS, JS)

### Success Indicators
- ✅ Dashboard loads without 404 errors
- ✅ Login works without HTTP 500 errors
- ✅ MetroPower logo displays in header
- ✅ All static assets load properly
- ✅ Debug endpoints return successful responses

## Troubleshooting Common Issues

### Still Getting 404 Errors
1. Check Vercel function logs in dashboard
2. Verify build completed successfully
3. Test individual endpoints
4. Clear browser cache (Ctrl+F5)

### Database Connection Fails
1. Verify all DB environment variables are set
2. Test database connection from external tool
3. Check firewall/network restrictions
4. Ensure SSL settings match database requirements

### Authentication Still Fails
1. Verify JWT secrets are set and long enough
2. Check database has users table
3. Run database initialization
4. Test with debug login endpoint first

### Logo Not Displaying
1. Test logo URL directly in browser
2. Check browser console for errors
3. Verify file exists in correct location
4. Check network tab for 404 errors

## Support
If issues persist after following this guide:
1. Share output from `/api/debug` endpoint
2. Provide Vercel function logs
3. Include browser console errors
4. List all environment variables (without values)

The deployment should be fully functional after completing these steps.
