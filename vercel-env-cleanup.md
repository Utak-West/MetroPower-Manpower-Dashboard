# Vercel Environment Variables Cleanup Guide

## 🗑️ ENVIRONMENT VARIABLES TO DELETE

These are the **incorrect local development variables** currently in your Vercel settings that must be removed:

### Delete These 4 Variables:
1. **`DB_HOST`** 
   - Current value: "localhost..."
   - ❌ DELETE - This points to local development server

2. **`DB_NAME`**
   - Current value: "metropower_dashboard"
   - ❌ DELETE - Wrong database name (should be "neondb")

3. **`DB_USER`**
   - Current value: "postgres"
   - ❌ DELETE - Wrong username (should be "neondb_owner")

4. **`DB_PASSWORD`**
   - Current value: Local development password
   - ❌ DELETE - Wrong password for production

---

## ✅ ENVIRONMENT VARIABLES TO KEEP

These variables are correct and should remain in Vercel:

1. **`JWT_SECRET`** ✅ KEEP
2. **`JWT_REFRESH_SECRET`** ✅ KEEP

---

## ➕ ENVIRONMENT VARIABLES TO ADD

After deleting the above variables, add these new ones from the `vercel-production.env` file:

### Critical Database Variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL` 
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### Application Configuration:
- `NODE_ENV=production`
- `DEMO_MODE_ENABLED=false`
- `USE_MEMORY_DB=false`

---

## 📋 STEP-BY-STEP INSTRUCTIONS

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **DELETE these 4 variables:**
   - Find `DB_HOST` → Click Delete
   - Find `DB_NAME` → Click Delete  
   - Find `DB_USER` → Click Delete
   - Find `DB_PASSWORD` → Click Delete

3. **ADD new variables** from `vercel-production.env` file

4. **Redeploy** the application

---

## ⚠️ IMPORTANT NOTES

- **Do NOT delete** `JWT_SECRET` or `JWT_REFRESH_SECRET`
- **Set all new variables** to "Production" environment
- **Redeploy after changes** to apply new configuration
- **The most critical variable is `POSTGRES_URL`** - this enables database connection

---

## 🔍 VERIFICATION

After making changes, test with:
```
curl "https://metropower-manpower-dashboard-8hmgfkfk3-utaks-projects.vercel.app/api/debug"
```

Should show Neon database connection instead of localhost errors.
