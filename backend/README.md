# MetroPower Manpower Dashboard - Backend API

A comprehensive backend system for tracking electricians and managing workforce assignments at MetroPower's Tucker Branch.

## Features

- **Employee Management**: Complete CRUD operations for employee data
- **Project Management**: Project tracking and assignment management
- **Assignment System**: Drag-and-drop assignment functionality with conflict detection
- **Dashboard Analytics**: Real-time metrics and workforce statistics
- **Export System**: Excel, CSV, PDF, and Markdown export capabilities
- **Archive System**: Weekly data archiving with historical access
- **Notification System**: Real-time notifications and email alerts
- **User Management**: Role-based access control and authentication
- **Real-time Updates**: WebSocket support for live dashboard updates

## Technology Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: PostgreSQL 12+
- **Authentication**: JWT with bcrypt
- **Real-time**: Socket.IO
- **Validation**: Joi & express-validator
- **Documentation**: Swagger/OpenAPI 3.0
- **Logging**: Winston
- **Testing**: Jest & Supertest

## Quick Start

### Prerequisites

- Node.js 16 or higher
- PostgreSQL 12 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Utak-West/MetroPower-Manpower-Dashboard.git
   cd MetroPower-Manpower-Dashboard/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Create PostgreSQL database
   createdb metropower_dashboard
   
   # Run migrations
   npm run migrate
   
   # Seed initial data
   npm run seed
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Environment Configuration

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=metropower_dashboard
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
FROM_EMAIL=noreply@metropower.com

# File Configuration
UPLOAD_PATH=./uploads
EXPORT_PATH=./exports

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,https://oxwdifao.manus.space
```

## API Documentation

Once the server is running, access the interactive API documentation at:
- **Development**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## Database Schema

The system uses PostgreSQL with the following core tables:

- **employees**: Employee information and status
- **projects**: Project details and management
- **assignments**: Daily employee-project assignments
- **users**: System users and authentication
- **positions**: Employee trades/positions
- **notifications**: System notifications
- **weekly_archives**: Historical week data
- **exports**: Export file tracking

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (Admin only)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Dashboard
- `GET /api/dashboard/current` - Current week dashboard data
- `GET /api/dashboard/week/:date` - Specific week data
- `GET /api/dashboard/summary` - Dashboard summary statistics
- `GET /api/dashboard/metrics` - Key performance metrics

### Employees
- `GET /api/employees` - List employees with filtering
- `GET /api/employees/:id` - Get employee details
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/search` - Search employees
- `GET /api/employees/unassigned/:date` - Get unassigned employees

### Projects
- `GET /api/projects` - List projects with filtering
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/active` - Get active projects

### Assignments
- `GET /api/assignments` - Get assignments for date range
- `GET /api/assignments/week/:date` - Get week assignments
- `POST /api/assignments` - Create assignment
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment
- `POST /api/assignments/bulk` - Bulk create assignments
- `POST /api/assignments/move` - Move employee assignment

### Exports
- `POST /api/exports/excel` - Generate Excel export
- `POST /api/exports/csv` - Generate CSV export
- `GET /api/exports/download/:filename` - Download export file
- `GET /api/exports` - List available exports

### Archives
- `GET /api/archives` - List archived weeks
- `GET /api/archives/:id` - Get archived week data
- `POST /api/archives` - Create week archive
- `DELETE /api/archives/:id` - Delete archive

## Default Users

After running the seed script, the following users are available:

| Username | Email | Password | Role |
|----------|-------|----------|------|
| admin | admin@metropower.com | MetroPower2025! | Admin |
| antione.harrell | antione.harrell@metropower.com | MetroPower2025! | Project Manager |
| branch.manager | manager@metropower.com | MetroPower2025! | Branch Manager |
| hr.user | hr@metropower.com | MetroPower2025! | HR |

## Development

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Database Operations
```bash
# Run migrations
npm run migrate

# Rollback last migration
npm run migrate down

# Check migration status
npm run migrate status

# Seed database
npm run seed
```

### Logging

The application uses Winston for structured logging:
- **Development**: Console output with colors
- **Production**: File-based logging with rotation
- **Levels**: error, warn, info, debug

Log files are stored in `./logs/`:
- `error.log` - Error messages only
- `combined.log` - All log messages
- `exceptions.log` - Uncaught exceptions

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: API endpoint protection
- **CORS Configuration**: Cross-origin request control
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Parameterized queries
- **Role-based Access**: Granular permission system

## Performance Considerations

- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: PostgreSQL connection management
- **Compression**: Response compression middleware
- **Caching**: Strategic caching for frequently accessed data
- **Pagination**: Large dataset handling

## Deployment

### Production Checklist

1. **Environment Variables**
   - Set `NODE_ENV=production`
   - Configure secure JWT secrets
   - Set up production database
   - Configure SMTP settings

2. **Database**
   - Run migrations: `npm run migrate`
   - Seed initial data: `npm run seed`
   - Set up database backups

3. **Security**
   - Enable SSL/HTTPS
   - Configure firewall rules
   - Set up monitoring and alerts

4. **Process Management**
   - Use PM2 or similar process manager
   - Configure log rotation
   - Set up health checks

### Docker Deployment

```bash
# Build image
docker build -t metropower-dashboard-api .

# Run container
docker run -p 3001:3001 --env-file .env metropower-dashboard-api
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Support

For support and questions:
- **Email**: dev@metropower.com
- **Documentation**: See `/docs` directory
- **Issues**: GitHub Issues

## License

This project is licensed under the MIT License - see the LICENSE file for details.
