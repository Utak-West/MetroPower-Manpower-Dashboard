# MetroPower Dashboard - Vercel Testing Guide

## Quick Access Testing

### 1. Access the Dashboard
Visit your Vercel deployment URL to access the MetroPower Dashboard.

### 2. Test Login Functionality
Use these demo credentials to test the login system:

**Admin Account**:
- Email: `admin@metropower.com`
- Password: `MetroPower2025!`
- Role: Administrator

**Project Manager Account**:
- Email: `antione.harrell@metropower.com`
- Password: `password123`
- Role: Project Manager

### 3. Debug Endpoint Testing
Visit `/api/debug` to check system status:
- Should show demo mode enabled
- Environment variables status
- Application health check

## Feature Testing Checklist

### ✅ Authentication System
- [ ] Login page loads correctly
- [ ] Admin credentials work
- [ ] Project manager credentials work
- [ ] Logout functionality works
- [ ] Session management functions

### ✅ Dashboard Features
- [ ] Main dashboard loads with demo data
- [ ] Employee list displays (5 demo employees)
- [ ] Project list shows (3 demo projects)
- [ ] Assignment data appears correctly
- [ ] Navigation menu functions

### ✅ API Endpoints
- [ ] `/health` - Health check endpoint
- [ ] `/api/debug` - Debug information
- [ ] `/api/dashboard` - Dashboard data
- [ ] `/api/auth/login` - Authentication
- [ ] `/api/auth/logout` - Logout

### ✅ Static Assets
- [ ] MetroPower logo displays
- [ ] CSS styles load correctly
- [ ] JavaScript files execute
- [ ] Favicon appears
- [ ] All images load

## Demo Data Overview

### Demo Users (2 total)
1. **System Administrator**
   - Full access to all features
   - User management capabilities
   - System configuration access

2. **Project Manager (Antione Harrell)**
   - Project management access
   - Employee assignment capabilities
   - Reporting features

### Demo Employees (5 total)
- John Smith (Senior Electrician)
- Mike Johnson (Electrician)
- Sarah Williams (Apprentice Electrician)
- David Brown (Field Supervisor)
- Lisa Davis (General Laborer)

### Demo Projects (3 total)
- Downtown Office Complex
- Industrial Warehouse Upgrade
- Residential Development

### Demo Assignments (3 total)
- Current day assignments for testing
- Employee-project relationships
- Assignment tracking functionality

## Expected Behavior

### ✅ Demo Mode Indicators
- Application should display demo mode status
- No external integrations will be active
- All data is in-memory (resets on restart)
- No actual database connections

### ✅ Functional Features
- User authentication and authorization
- Dashboard data visualization
- Employee and project management
- Assignment tracking
- Export functionality (demo data)

### ✅ Disabled Features
- External system integrations
- Real-time data synchronization
- Database persistence
- Email notifications
- File uploads to external storage

## Troubleshooting

### If Login Fails
1. Verify you're using the correct demo credentials
2. Check `/api/debug` for authentication status
3. Clear browser cache and cookies
4. Try the other demo account

### If Dashboard Doesn't Load
1. Check browser console for JavaScript errors
2. Verify `/api/dashboard` endpoint responds
3. Confirm demo mode is enabled in `/api/debug`
4. Check network tab for failed requests

### If Assets Don't Load
1. Verify Vercel deployment completed successfully
2. Check static file routing in `vercel.json`
3. Confirm frontend files are properly deployed
4. Test direct asset URLs

## Performance Expectations

### ✅ Fast Loading
- Demo mode eliminates database queries
- In-memory data provides instant responses
- No external API calls to slow down requests
- Optimized for Vercel serverless environment

### ✅ Responsive Design
- Dashboard adapts to different screen sizes
- Mobile-friendly interface
- Touch-friendly controls
- Accessible navigation

## Security Notes

### Demo Mode Security
- Demo credentials are for testing only
- No sensitive data is stored
- All data resets on application restart
- JWT tokens are properly configured

### Production Considerations
- Change all demo passwords before production
- Configure proper database connections
- Set up environment-specific secrets
- Enable proper logging and monitoring

## Support and Next Steps

### If Issues Persist
1. Check the latest deployment status on Vercel
2. Review application logs in Vercel dashboard
3. Verify all environment variables are set
4. Test the debug endpoint for detailed status

### For Production Setup
1. Configure PostgreSQL database
2. Set up proper environment variables
3. Implement external integrations as needed
4. Configure monitoring and alerting

### For Development
1. Clone the repository locally
2. Set up local development environment
3. Configure local database connection
4. Run in development mode for full features

## Success Criteria

The deployment is considered successful when:
- ✅ Application loads without errors
- ✅ Demo login credentials work
- ✅ Dashboard displays demo data
- ✅ All API endpoints respond correctly
- ✅ Static assets load properly
- ✅ No console errors in browser
- ✅ Debug endpoint shows healthy status

## Contact Information

For technical support or questions about the MetroPower Dashboard deployment, refer to the project documentation or contact the development team.

---

**Last Updated**: 2025-06-14  
**Deployment Status**: ✅ Successful  
**Demo Mode**: ✅ Active  
**External Dependencies**: ✅ Resolved
