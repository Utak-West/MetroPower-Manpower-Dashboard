# MetroPower Dashboard

A comprehensive workforce management system for tracking electricians and managing assignments at MetroPower's Tucker Branch. Built for Antione Harrell, Assistant Project Manager, to optimize operations and streamline workforce allocation.

## Project Overview

This repository contains the complete MetroPower Dashboard system, a comprehensive workforce management solution designed to solve critical issues with employee tracking, payroll accuracy, and resource allocation across multiple construction projects at MetroPower's Tucker Branch.

## Core Problem Addressed

The MetroPower Tucker Branch faced significant challenges with:
- **Payroll Discrepancies**: Manual tracking led to inconsistencies between field assignments and payroll records
- **Resource Allocation**: Difficulty in optimizing employee assignments across multiple projects
- **Real-time Visibility**: Lack of instant access to employee locations and project status
- **Cost Allocation**: Inaccurate project cost distribution affecting profitability analysis

## Solution Architecture

### Frontend Components
- **Interactive Dashboard**: Real-time view of employee assignments and project status
- **Drag-and-Drop Interface**: Intuitive employee assignment management
- **Responsive Design**: Optimized for desktop and mobile devices
- **Real-time Updates**: WebSocket-powered live data synchronization

### Backend Infrastructure
- **RESTful API**: Comprehensive endpoints for all dashboard operations
- **Authentication System**: JWT-based security with role-based access control
- **Database Integration**: PostgreSQL with connection pooling and failover
- **Real-time Communication**: Socket.IO for live updates
- **Export Capabilities**: Excel and PDF report generation

### Key Features
- **Employee Management**: Track electricians, supervisors, and support staff
- **Project Assignment**: Visual assignment interface with drag-and-drop functionality
- **Time Tracking**: Automated attendance and hours calculation
- **Reporting**: Comprehensive reports for payroll and project management
- **Notifications**: Real-time alerts for assignment changes and updates
- **Archive System**: Historical data retention and audit trails

## Technology Stack

### Frontend
- **HTML5/CSS3**: Modern responsive design
- **JavaScript (ES6+)**: Interactive functionality
- **Socket.IO Client**: Real-time communication
- **Chart.js**: Data visualization

### Backend
- **Node.js**: Server runtime environment
- **Express.js**: Web application framework
- **PostgreSQL**: Primary database
- **Socket.IO**: Real-time communication
- **JWT**: Authentication and authorization
- **Bcrypt**: Password hashing
- **Multer**: File upload handling

### DevOps & Deployment
- **Docker**: Containerization
- **Docker Compose**: Multi-service orchestration
- **Vercel**: Serverless deployment platform
- **GitHub Actions**: CI/CD pipeline

## Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Docker (optional)

### Local Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd MetroPower-Dashboard
```

2. **Install dependencies**
```bash
npm install
cd backend && npm install
```

3. **Environment Configuration**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

4. **Database Setup**
```bash
# Start PostgreSQL (if using Docker)
docker-compose up -d postgres

# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

5. **Start Development Server**
```bash
npm run dev
```

The application will be available at:
- **Dashboard**: http://localhost:3000
- **API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs

## Environment Variables

### Required Variables
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=metropower_dashboard
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Application Configuration
NODE_ENV=development
PORT=3001
HOST=localhost
```

### Optional Variables
```env
# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=xlsx,xls,csv,pdf

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## API Documentation

The API follows RESTful conventions with comprehensive documentation available at `/api-docs` when running the server.

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Token verification
- `POST /api/auth/refresh` - Token refresh

### Dashboard Endpoints
- `GET /api/dashboard/current` - Current dashboard data
- `GET /api/dashboard/metrics` - Key performance metrics
- `GET /api/dashboard/week/:date` - Weekly assignment data

### Employee Management
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Project Management
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Assignment Management
- `GET /api/assignments` - List assignments
- `POST /api/assignments` - Create assignment
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment

## Deployment

### Vercel Deployment (Recommended)

1. **Connect to Vercel**
```bash
npm install -g vercel
vercel login
vercel
```

2. **Configure Environment Variables**
Set all required environment variables in the Vercel dashboard.

3. **Deploy**
```bash
vercel --prod
```

### Docker Deployment

1. **Build and Run**
```bash
docker-compose up -d
```

2. **Access Application**
- Dashboard: http://localhost:3000
- API: http://localhost:3001

## Testing

### Run Tests
```bash
npm test
```

### Test Database Connection
```bash
npm run test-db
```

### Manual Testing
1. Navigate to the dashboard
2. Login with demo credentials (any username/password in demo mode)
3. Test employee assignment functionality
4. Verify real-time updates
5. Test export functionality

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with salt rounds
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CORS Configuration**: Controlled cross-origin requests

## Performance Optimizations

- **Connection Pooling**: Efficient database connections
- **Caching**: Redis-based caching for frequently accessed data
- **Compression**: Gzip compression for API responses
- **Lazy Loading**: Optimized frontend resource loading
- **Database Indexing**: Optimized query performance

## Monitoring & Logging

- **Structured Logging**: Winston-based logging system
- **Error Tracking**: Comprehensive error handling and reporting
- **Performance Monitoring**: Request timing and resource usage
- **Health Checks**: Automated system health monitoring

## Support & Maintenance

### Troubleshooting
1. Check application logs in `backend/logs/`
2. Verify database connectivity
3. Confirm environment variables are set correctly
4. Review API documentation for endpoint usage

### Common Issues
- **Database Connection**: Ensure PostgreSQL is running and accessible
- **Authentication Errors**: Verify JWT secrets are configured
- **File Upload Issues**: Check file size limits and allowed types
- **Real-time Updates**: Confirm WebSocket connections are established

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

Copyright 2025 The HigherSelf Network. All rights reserved.

## Contact

For support or questions, contact: info@higherselflife.com
