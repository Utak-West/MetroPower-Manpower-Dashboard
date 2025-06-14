# MetroPower Manpower Dashboard

## 🚀 Project Overview

The MetroPower Manpower Dashboard is a workforce management system designed for MetroPower's Tucker Branch. This application provides employee tracking, project management, and authentication capabilities with a focus on the electrical contracting industry.

## ✅ HTTP 500 Login Error - RESOLVED

### Root Cause Analysis
The HTTP 500 error during login attempts was caused by:
1. **Missing Database Configuration**: The `backend/src/config/database.js` file was missing
2. **Missing Application Configuration**: The `backend/src/config/app.js` file was missing  
3. **Missing User Model**: The authentication logic in `backend/src/models/User.js` was missing
4. **Missing Route Handlers**: Authentication routes were not implemented
5. **Missing Middleware**: Error handling and authentication middleware were missing

### Solution Implemented
✅ **Created In-Memory Database System**: Implemented a fallback in-memory database for development/demo purposes
✅ **Built Complete Authentication System**: JWT-based authentication with bcrypt password hashing
✅ **Implemented Error Handling**: Comprehensive error handling middleware with proper HTTP status codes
✅ **Created User Management**: Full user model with authentication, authorization, and role-based access
✅ **Added Logging System**: Winston-based logging with configurable levels
✅ **Built API Routes**: Complete REST API with authentication endpoints

## 🎨 Brand Styling - UPDATED

### MetroPower Red Color Scheme
Updated the dashboard to use MetroPower's official red-based branding:
- **Primary Color**: `#dc2626` (MetroPower Red)
- **Primary Dark**: `#b91c1c` (Darker Red for hover states)
- **Primary Light**: `#ef4444` (Lighter Red for accents)
- **Favicon**: Updated to use red MetroPower branding

### Visual Elements
- Red gradient background matching MetroPower's corporate identity
- Professional login interface with MetroPower branding
- Responsive design optimized for desktop and mobile
- Corporate-appropriate styling without emojis

## 🔐 Authentication System

### Demo User Accounts
1. **System Administrator**
   - Email: `admin@metropower.com`
   - Password: `MetroPower2025!`
   - Role: Admin

2. **Antoine Harrell (Project Manager)**
   - Email: `antoine.harrell@metropower.com`
   - Password: `password123`
   - Role: Project Manager

### Security Features
- JWT token-based authentication
- Bcrypt password hashing (12 rounds)
- Rate limiting on authentication endpoints
- Role-based access control
- Secure cookie handling for refresh tokens

## 🛠 Technical Architecture

### Backend (Node.js/Express)
- **Framework**: Express.js with comprehensive middleware
- **Database**: In-memory database for development (PostgreSQL ready for production)
- **Authentication**: JWT with refresh token support
- **Security**: Helmet, CORS, rate limiting, input validation
- **Logging**: Winston with configurable levels
- **Error Handling**: Centralized error handling with proper HTTP codes

### Frontend (HTML/CSS/JavaScript)
- **Styling**: Bootstrap 5 with custom MetroPower red theme
- **JavaScript**: Vanilla JS with fetch API for authentication
- **Responsive**: Mobile-first design approach
- **Accessibility**: Proper form labels and ARIA attributes

### API Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/change-password` - Change password
- `GET /health` - Server health check

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- No database setup required (uses in-memory storage)

### Starting the Server
```bash
# Option 1: Use the startup script
./start-server.sh

# Option 2: Manual startup
cd backend
USE_MEMORY_DB=true LOG_LEVEL=info node server.js
```

### Accessing the Application
1. **Backend API**: http://localhost:3001
2. **Frontend**: Open `frontend/index.html` in your browser
3. **Health Check**: http://localhost:3001/health

### Testing Login
1. Open the frontend in your browser
2. Use either demo account:
   - `admin@metropower.com` / `MetroPower2025!`
   - `antoine.harrell@metropower.com` / `password123`
3. Successful login will display user information and JWT token

## 📁 Project Structure

```
MetroPower Manpower Dashboard/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── app.js              # Application configuration
│   │   │   └── database.js         # Database connection & queries
│   │   ├── middleware/
│   │   │   ├── auth.js             # Authentication middleware
│   │   │   └── errorHandler.js     # Error handling middleware
│   │   ├── models/
│   │   │   └── User.js             # User model & authentication
│   │   ├── routes/
│   │   │   ├── auth.js             # Authentication routes
│   │   │   └── [other routes]      # Placeholder routes
│   │   └── utils/
│   │       └── logger.js           # Winston logging utility
│   ├── server.js                   # Main server file
│   └── package.json                # Dependencies
├── frontend/
│   └── index.html                  # Login interface
├── .env                            # Environment variables
├── start-server.sh                 # Startup script
└── README.md                       # This file
```

## 🔧 Environment Configuration

Key environment variables in `.env`:
```env
USE_MEMORY_DB=true                  # Use in-memory database
NODE_ENV=development                # Environment
PORT=3001                           # Server port
LOG_LEVEL=info                      # Logging level
JWT_SECRET=metropower_jwt_secret    # JWT signing secret
```

## 🧪 Testing

### Manual Testing
1. **Server Health**: `curl http://localhost:3001/health`
2. **Valid Login**: `curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"identifier": "antoine.harrell@metropower.com", "password": "password123"}'`
3. **Invalid Login**: `curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"identifier": "test@test.com", "password": "wrong"}'`

### Expected Results
- ✅ Server starts without errors
- ✅ Health endpoint returns 200 OK
- ✅ Valid credentials return JWT token and user data
- ✅ Invalid credentials return 401 with error message
- ✅ Frontend displays MetroPower red branding
- ✅ Login form works with demo credentials

## 🚀 Production Deployment

For production deployment:
1. Set `USE_MEMORY_DB=false` in environment
2. Configure PostgreSQL database connection
3. Update JWT secrets to secure values
4. Enable SSL/HTTPS
5. Configure proper CORS origins
6. Set up proper logging and monitoring

## 📞 Support

This dashboard was built for MetroPower's Tucker Branch to track electricians and manage workforce assignments. The system is designed to integrate with existing MetroPower infrastructure and can be extended with additional features as needed.

**Company**: MetroPower  
**Branch**: Tucker Branch  
**Contact**: Antoine Harrell (Assistant Project Manager)
