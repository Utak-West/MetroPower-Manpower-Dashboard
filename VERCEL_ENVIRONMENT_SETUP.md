# MetroPower Dashboard - Vercel Environment Setup

## Critical Environment Variables Required

### Database Configuration (REQUIRED)
```env
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_SSL=true
```

### JWT Secrets (REQUIRED)
```env
JWT_SECRET=your-super-secure-jwt-secret-32-chars-minimum
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-32-chars-minimum
```

### Application Settings
```env
NODE_ENV=production
CORS_ORIGIN=https://your-vercel-domain.vercel.app
```

## Step-by-Step Setup Instructions

### Step 1: Create Database (Choose One Option)

#### Option A: Supabase (Recommended - Free Tier)
1. Go to [supabase.com](https://supabase.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Choose organization and enter:
   - Name: `metropower-dashboard`
   - Database Password: (choose strong password)
   - Region: `East US (North Virginia)`
5. Wait 2-3 minutes for setup
6. Go to Settings → Database
7. Copy connection details:
   - Host: `db.xxx.supabase.co`
   - Database: `postgres`
   - User: `postgres`
   - Password: (your chosen password)
   - Port: `5432`

#### Option B: Neon (Alternative Free Option)
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create new project
4. Copy connection string

### Step 2: Generate JWT Secrets
Run these commands in terminal:
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Set Environment Variables in Vercel
1. Go to [vercel.com](https://vercel.com)
2. Navigate to your project
3. Go to Settings → Environment Variables
4. Add each variable:

**Database Variables:**
- `DB_HOST` = `db.xxx.supabase.co` (from Supabase)
- `DB_PORT` = `5432`
- `DB_NAME` = `postgres`
- `DB_USER` = `postgres`
- `DB_PASSWORD` = (your Supabase password)
- `DB_SSL` = `true`

**JWT Variables:**
- `JWT_SECRET` = (generated 64-character string)
- `JWT_REFRESH_SECRET` = (generated 64-character string)

**Application Variables:**
- `NODE_ENV` = `production`
- `CORS_ORIGIN` = `https://your-vercel-domain.vercel.app`

### Step 4: Redeploy Application
1. Go to Deployments tab in Vercel
2. Click "Redeploy" on latest deployment
3. Wait for deployment to complete

### Step 5: Initialize Database
Visit: `https://your-vercel-domain.vercel.app/api/debug/init-db`

Expected response:
```json
{
  "success": true,
  "message": "Database initialized and seeded successfully"
}
```

### Step 6: Test Authentication
Visit: `https://your-vercel-domain.vercel.app/api/debug/test-login`

Expected response:
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "user_id": 1,
    "username": "admin",
    "email": "admin@metropower.com",
    "role": "admin"
  },
  "token_length": 200
}
```

### Step 7: Test Dashboard Access
1. Go to: `https://your-vercel-domain.vercel.app/`
2. Should see login modal
3. Use credentials:
   - Email: `admin@metropower.com`
   - Password: `MetroPower2025!`
4. Should successfully log in and see dashboard

## Troubleshooting

### Database Connection Issues
**Problem:** `database_connection: { status: 'error' }`

**Solutions:**
1. Verify all DB environment variables are set correctly
2. Check database allows connections from `0.0.0.0/0` (Vercel IPs)
3. Ensure SSL is enabled if required
4. Test connection from external tool

### JWT Configuration Issues
**Problem:** `jwt_config: { error: '...' }`

**Solutions:**
1. Ensure JWT_SECRET is at least 32 characters
2. Verify JWT_REFRESH_SECRET is set
3. Check for special characters that might cause issues

### Authentication Failures
**Problem:** Login returns HTTP 500

**Solutions:**
1. Check `/api/debug` shows all green
2. Verify database has users table
3. Run `/api/debug/init-db` if needed
4. Test with `/api/debug/test-login` first

### Still Getting 404 Errors
**Problem:** Dashboard not accessible

**Solutions:**
1. Check Vercel function logs
2. Verify build completed successfully
3. Clear browser cache
4. Try incognito mode

## Verification Checklist

- [ ] Database created and accessible
- [ ] All environment variables set in Vercel
- [ ] Application redeployed successfully
- [ ] `/api/debug/health` returns OK
- [ ] `/api/debug` shows all systems green
- [ ] `/api/debug/init-db` completes successfully
- [ ] `/api/debug/test-login` authenticates successfully
- [ ] Dashboard loads at root URL
- [ ] Login works with admin credentials
- [ ] Logo displays in header
- [ ] No 404 or 500 errors in browser console

## Default Credentials

After successful setup:
- **Email:** `admin@metropower.com`
- **Password:** `MetroPower2025!`

## Support

If issues persist:
1. Share output from `/api/debug` endpoint
2. Provide Vercel function logs
3. Include browser console errors
4. List environment variables (without values)
