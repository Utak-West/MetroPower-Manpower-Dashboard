# MetroPower Dashboard - Vercel Deployment Instructions

## Quick Deployment via Vercel Web Dashboard

### Step 1: Access Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account

### Step 2: Import Repository
1. Click "New Project"
2. Select "Import Git Repository"
3. Choose `Utak-West/MetroPower-Manpower-Dashboard`

### Step 3: Configure Project
- **Project Name**: `metropower-manpower-dashboard`
- **Framework Preset**: Other
- **Root Directory**: `./` (default)
- **Build Command**: `npm run vercel-build`
- **Output Directory**: Leave empty
- **Install Command**: `npm install`

### Step 4: Environment Variables (Optional)
The `vercel.json` file already contains all necessary environment variables:
- `USE_MEMORY_DB=true` (enables demo mode)
- `DEMO_MODE_ENABLED=true`
- JWT secrets and other configurations

### Step 5: Deploy
Click "Deploy" and wait for completion.

## Authentication Credentials

Once deployed, use these credentials to access the dashboard:

### Admin Account
- **Email**: `admin@metropower.com`
- **Password**: `MetroPower2025!`
- **Role**: Administrator

### Project Manager Account (Antoine Harrell)
- **Email**: `antoine.harrell@metropower.com`
- **Password**: `password123`
- **Role**: Project Manager

## Post-Deployment Testing

### 1. Access the Application
Visit your Vercel deployment URL (e.g., `https://metropower-manpower-dashboard.vercel.app`)

### 2. Test Login
- Try logging in with both sets of credentials above
- Verify you can access the dashboard features

### 3. Test API Endpoints
- Visit `/api/debug` to check system status
- Visit `/health` for health check
- Verify assignment management works

### 4. Test Core Features
- **Assignment Management**: Create, edit, delete assignments
- **Employee Management**: View employee list
- **Project Management**: View project list
- **Report Generation**: Export CSV/PDF reports

## Troubleshooting

### If Login Fails
1. Check browser console for errors
2. Visit `/api/debug` to verify system status
3. Ensure demo mode is enabled in environment variables

### If API Calls Fail
1. Check Network tab in browser developer tools
2. Verify Vercel function logs in dashboard
3. Ensure all environment variables are set correctly

### If Assets Don't Load
1. Verify Vercel deployment completed successfully
2. Check static file routing in `vercel.json`
3. Test direct asset URLs

## Features Available in Demo Mode

✅ **Authentication System**
- Secure JWT-based login
- Role-based access control
- Session management

✅ **Assignment Management**
- Create, read, update, delete assignments
- Date-based assignment scheduling
- Employee-project assignment tracking

✅ **Employee Management**
- View employee roster
- Employee skills and position tracking
- Active/inactive status management

✅ **Project Management**
- Project listing and details
- Project status tracking
- Location and priority management

✅ **Dashboard Analytics**
- Real-time metrics display
- Assignment statistics
- Employee utilization tracking

✅ **Export Functionality**
- CSV export for assignments
- PDF report generation
- Date range filtering

✅ **Real-time Updates**
- Live dashboard updates
- Assignment status changes
- Notification system

## Performance Optimizations

✅ **Serverless Architecture**
- Demo mode eliminates database queries
- In-memory data provides instant responses
- No external API calls to slow down requests
- Optimized for Vercel serverless environment

✅ **Responsive Design**
- Dashboard adapts to different screen sizes
- Mobile-friendly interface
- Touch-optimized controls

✅ **Security Features**
- JWT token authentication
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection

## Next Steps After Deployment

1. **Test all functionality** with the provided credentials
2. **Verify performance** and responsiveness
3. **Check mobile compatibility**
4. **Test export features** (CSV/PDF generation)
5. **Confirm real-time updates** work properly

## Support

If you encounter any issues during deployment or testing:
1. Check the Vercel deployment logs
2. Review the browser console for client-side errors
3. Test the `/api/debug` endpoint for system diagnostics
4. Verify all environment variables are properly set

The application is designed to be robust and fall back to demo mode if any issues occur, ensuring a smooth user experience.
