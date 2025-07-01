# MetroPower Dashboard - Vercel Environment Setup Guide

## 🎯 **OBJECTIVE**
Transition MetroPower Dashboard from mixed configuration to clean production deployment.

## 📋 **STEP-BY-STEP INSTRUCTIONS**

### **STEP 1: Clean Existing Environment Variables**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your MetroPower Dashboard project
3. Navigate to **Settings** → **Environment Variables**
4. **DELETE ALL existing environment variables** (click the trash icon for each one)
5. Confirm deletion for each variable until the list is completely empty

### **STEP 2: Upload New Production Environment Variables**
1. Open the file `/Users/utakwest/Desktop/vercel-production.env`
2. Copy each variable **ONE AT A TIME** from the file
3. In Vercel Dashboard → Environment Variables:
   - Click **"Add New"**
   - Paste the variable name (before the `=`)
   - Paste the variable value (after the `=`)
   - Set **Environment** to **"Production"**
   - Click **"Save"**
4. Repeat for all 47 variables in the file

### **STEP 3: Critical Variables to Verify**
Ensure these essential variables are set correctly:

✅ **NODE_ENV** = `production`
✅ **DEMO_MODE_ENABLED** = `false`
✅ **USE_MEMORY_DB** = `false`
✅ **POSTGRES_URL** = `postgres://neondb_owner:npg_FIzeB8CoU3tM@ep-small-wildflower-a4s9we42-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require`
✅ **JWT_SECRET** = `MetroPower2025-Production-JWT-Access-Token-Secret-Key-For-Dashboard-Authentication-System-Security-v2`

### **STEP 4: Deploy Application**
1. After all environment variables are added, go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Wait for deployment to complete (~2-3 minutes)

### **STEP 5: Test Production Deployment**
1. Visit your production URL
2. Test login with manager credentials:
   - **Email**: `antione.harrell@metropower.com`
   - **Password**: `MetroPower2025!`
3. Verify database connectivity and CRUD operations

## 🔧 **TROUBLESHOOTING**

### If Authentication Fails:
- Check JWT_SECRET and JWT_REFRESH_SECRET are set correctly
- Verify POSTGRES_URL is accessible
- Check browser console for errors

### If Database Connection Fails:
- Verify all POSTGRES_* variables are set
- Test Neon database connectivity
- Check deployment logs in Vercel

### If Features Don't Work:
- Verify all FEATURE_* flags are set correctly
- Check CORS_ORIGIN is set to `*`
- Ensure VERCEL=1 is set

## 📞 **SUPPORT**
If issues persist, check:
1. Vercel deployment logs
2. Browser developer console
3. Network tab for failed API calls

## ✅ **SUCCESS CRITERIA**
- [ ] All old environment variables deleted
- [ ] All 47 new variables added to Production environment
- [ ] Application successfully redeployed
- [ ] Manager login works with antione.harrell@metropower.com
- [ ] Database operations function correctly
- [ ] All dashboard features accessible

---
**File Location**: `/Users/utakwest/Desktop/vercel-production.env`
**Total Variables**: 47
**Environment Scope**: Production Only
