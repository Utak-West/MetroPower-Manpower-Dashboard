# MetroPower Dashboard - Vercel Deployment Guide

## Overview

This guide will help you deploy the MetroPower Dashboard to Vercel with a PostgreSQL database. Demo mode has been completely removed for a production-ready deployment.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Ensure your code is pushed to GitHub
3. **Database**: Set up a cloud PostgreSQL database (recommended: Supabase, Neon, or PlanetScale)

## Quick Deployment Steps

### 1. Database Setup (Required)

Since Vercel is serverless, you need a cloud database. We recommend **Supabase** (free tier available):

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your database connection details:
   - Host
   - Database name
   - Username
   - Password
   - Port (usually 5432)

### 2. Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect the configuration from `vercel.json`

#### Option B: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 3. Configure Environment Variables

In your Vercel project dashboard, go to Settings > Environment Variables and add:

**Required Variables:**
```
NODE_ENV=production
DB_HOST=your-supabase-host
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-supabase-password
DB_SSL=true
JWT_SECRET=your-super-secure-jwt-secret-32-chars-min
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-32-chars-min
CORS_ORIGIN=https://your-vercel-domain.vercel.app
WEBSOCKET_CORS_ORIGIN=https://your-vercel-domain.vercel.app
```

**Optional Variables:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@metropower.com
```

### 4. Database Migration

After deployment, you need to run the database migrations:

1. In your Vercel project dashboard, go to Functions
2. Find your deployment and access the server logs
3. The migrations should run automatically on first deployment
4. If not, you can trigger them via the API endpoint: `https://your-domain.vercel.app/api/migrate`

## Important Notes

### Socket.IO Limitations
- Vercel's serverless functions have limitations with Socket.IO
- Real-time features may not work as expected
- Consider using Vercel's Edge Functions or a dedicated WebSocket service

### File Uploads
- Vercel has a 50MB limit for serverless functions
- File uploads are stored temporarily and may not persist
- Consider using cloud storage (AWS S3, Cloudinary) for production

### Database Connections
- Use connection pooling to avoid connection limits
- The current setup uses `pg-pool` which should handle this

## Troubleshooting

### Common Issues:

1. **Database Connection Errors**
   - Ensure your database allows connections from Vercel's IP ranges
   - Check that SSL is enabled if required

2. **Environment Variables Not Loading**
   - Verify all required environment variables are set in Vercel dashboard
   - Redeploy after adding new environment variables

3. **Static Files Not Loading**
   - Check that the `frontend` directory structure matches the routes in `vercel.json`
   - Ensure file paths are correct

4. **API Routes Not Working**
   - Verify the API routes in `vercel.json` match your backend routes
   - Check function logs in Vercel dashboard

## Post-Deployment Checklist

- [ ] Database connection working
- [ ] API endpoints responding
- [ ] Frontend loading correctly
- [ ] Authentication working
- [ ] File uploads working (if needed)
- [ ] Email notifications working (if configured)
- [ ] All environment variables set
- [ ] SSL certificate active
- [ ] Custom domain configured (optional)

## Support

For deployment issues:
1. Check Vercel function logs
2. Review the GitHub repository issues
3. Contact the development team

## Production Recommendations

1. **Custom Domain**: Set up a custom domain for professional appearance
2. **Monitoring**: Set up monitoring and alerts
3. **Backup**: Ensure database backups are configured
4. **Security**: Review and update JWT secrets regularly
5. **Performance**: Monitor function execution times and optimize as needed

## File Structure Created

The following files have been created for Vercel deployment:

```text
├── vercel.json                 # Vercel configuration
├── package.json               # Root package.json for monorepo
├── .env.example              # Environment variables template
├── .vercelignore             # Files to exclude from deployment
├── api/
│   └── index.js              # Serverless function entry point
├── scripts/
│   └── vercel-build.js       # Build script for database setup
└── VERCEL_DEPLOYMENT.md      # This deployment guide
```

## Next Steps

1. **Push to GitHub**: Ensure all files are committed and pushed
2. **Set up Database**: Create a cloud PostgreSQL database (Supabase recommended)
3. **Deploy to Vercel**: Follow the deployment steps above
4. **Configure Environment Variables**: Set all required variables in Vercel dashboard
5. **Test Deployment**: Verify all functionality works correctly
6. **Share with Team**: Provide Antione Harrell and the Metro Power team with the deployment URL

## Support Contact

For technical support with this deployment:

- Check the GitHub repository issues
- Review Vercel function logs for debugging
- Contact the development team for assistance
