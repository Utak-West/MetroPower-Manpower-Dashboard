# MetroPower Manpower Dashboard

A comprehensive workforce management system for tracking electricians and managing assignments at MetroPower's Tucker Branch. Built for Antione Harrell, Assistant Project Manager, to optimize operations and streamline workforce allocation.

## Project Overview

This repository contains the complete MetroPower Manpower Dashboard system, a comprehensive workforce management solution designed to solve critical issues with employee tracking, payroll accuracy, and resource allocation across multiple construction projects at MetroPower's Tucker Branch.

## Core Problem Addressed

Project managers currently cannot track real-time employee movements between job sites, leading to payroll discrepancies and unfair cost allocation when workers are reassigned mid-week without proper documentation.

## Features

### Core Functionality
- **Real-time Dashboard**: Live view of employee assignments across projects
- **Drag & Drop Interface**: Intuitive assignment management with visual feedback
- **Employee Management**: Complete CRUD operations for workforce data
- **Project Tracking**: Comprehensive project management and assignment tracking
- **Conflict Detection**: Automatic detection and prevention of double-booking
- **Export System**: Excel, CSV, and PDF export capabilities
- **Archive System**: Weekly data archiving with historical access
- **Real-time Updates**: WebSocket-powered live updates across all clients

### Advanced Features
- **Role-based Access Control**: Admin, Project Manager, Branch Manager, HR, and View Only roles
- **Notification System**: Real-time alerts and email notifications
- **Search & Filtering**: Advanced search capabilities across all data
- **Responsive Design**: Mobile-friendly interface for field access
- **API Documentation**: Comprehensive Swagger/OpenAPI documentation
- **Audit Logging**: Complete audit trail of all system changes

## Architecture

### Frontend
- **Technology**: Vanilla JavaScript, HTML5, CSS3
- **Features**: Responsive design, drag-and-drop, real-time updates
- **Styling**: Custom CSS with MetroPower branding

### Backend
- **Framework**: Node.js with Express.js
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT-based with bcrypt password hashing
- **Real-time**: Socket.IO for live updates
- **Documentation**: Swagger/OpenAPI 3.0

### Infrastructure
- **Containerization**: Docker and Docker Compose
- **Reverse Proxy**: Nginx for static file serving and API proxying
- **Caching**: Redis for session management and caching
- **Logging**: Winston with structured logging

## Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- Docker & Docker Compose (optional)

### Option 1: Docker Deployment (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Utak-West/MetroPower-Manpower-Dashboard.git
   cd MetroPower-Manpower-Dashboard
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Dashboard: http://localhost:8080
   - API: http://localhost:3001
   - API Docs: http://localhost:3001/api-docs

### Option 2: Manual Setup

1. **Clone and setup backend**
   ```bash
   git clone https://github.com/Utak-West/MetroPower-Manpower-Dashboard.git
   cd MetroPower-Manpower-Dashboard/backend
   npm install
   cp .env.example .env
   # Edit .env with your database configuration
   ```

2. **Setup database**
   ```bash
   createdb metropower_dashboard
   npm run migrate
   npm run seed
   ```

3. **Start backend**
   ```bash
   npm run dev
   ```

4. **Serve frontend**
   ```bash
   cd ../frontend
   # Serve with any static file server
   python -m http.server 3000
   # or
   npx serve -p 3000
   ```

### Default Login Credentials

After running the seed script, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@metropower.com | MetroPower2025! |
| Project Manager | antione.harrell@metropower.com | MetroPower2025! |
| Branch Manager | manager@metropower.com | MetroPower2025! |
| HR | hr@metropower.com | MetroPower2025! |

## Implementation Guide

### Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3 with real-time updates
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT-based with bcrypt password hashing
- **Infrastructure**: Docker, Nginx, Redis

### Integration Points
- **ADP Integration**: Employee roster imports and payroll data
- **IFS Arena**: Export compatibility for cost allocation
- **Email System**: Automated assignment change notifications
- **Real-time Updates**: WebSocket-powered live dashboard updates

## Design Decisions

The dashboard design follows MetroPower's brand guidelines with a focus on:

- Clear visual hierarchy emphasizing the current day and active projects
- Color-coding for different trade categories (Electrician, Field Supervisor, etc.)
- Intuitive drag-and-drop interface for employee assignment
- Comprehensive notification system for project managers

## Deployment Recommendations

This template is structured for easy deployment to platforms like Vercel:

1. Clone this repository to your GitHub account
2. Connect your GitHub repository to Vercel
3. Configure environment variables for database and email services
4. Deploy the application

## Documentation

Detailed documentation is available in the `docs/` directory:

- `brand_guidelines.md`: MetroPower brand specifications
- `dashboard_requirements.md`: Detailed functional requirements
- `dashboard_design_best_practices.md`: Modern dashboard design principles
- `dashboard_features_list.md`: Comprehensive feature specifications
- `dashboard_layout_concepts.md`: UI layout and interaction patterns
- `dashboard_workflow_templates.md`: User workflow templates
- `database_schema.md`: Database structure and relationships
- `manpower_board_analysis.md`: Analysis of current system
## Dashboard Overview

### Main Dashboard
- **Weekly Grid View**: Visual representation of employee assignments
- **Unassigned Employees**: Sidebar showing available workforce
- **Project Columns**: Organized by active projects
- **Real-time Updates**: Live changes across all connected clients

### Key Metrics
- Total active employees
- Current assignments
- Utilization rates
- Project statistics

### Export Options
- **Excel**: Comprehensive workbook with multiple sheets
- **CSV**: Individual data exports for analysis
- **Date Range**: Flexible date selection for exports

## Development

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm test            # Run tests
npm run migrate     # Run database migrations
npm run seed        # Seed sample data
```

### Frontend Development
The frontend uses vanilla JavaScript for maximum compatibility and performance. Key files:
- `frontend/index.html` - Main dashboard interface
- `frontend/js/dashboard.js` - Core functionality and API integration
- `frontend/css/dashboard.css` - Styling and responsive design

## Configuration

### Environment Variables
Key configuration options in `.env`:

```env
# Server
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=metropower_dashboard
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
```

## Security Features

- **Authentication**: JWT-based with secure token management
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API endpoint protection
- **CORS Configuration**: Secure cross-origin requests
- **SQL Injection Protection**: Parameterized queries
- **Password Security**: bcrypt hashing with salt

## Documentation

- **API Documentation**: Available at `/api-docs` when running
- **Database Schema**: See `backend/src/migrations/`
- **Frontend Guide**: See `frontend/README.md`
- **Deployment Guide**: See `docs/deployment.md`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- **Project Manager**: Antione Harrell
- **Development Team**: Utak West
- **Email**: antione.harrell@metropower.com
- **Issues**: GitHub Issues

## Acknowledgments

- MetroPower Tucker Branch team for requirements and feedback
- Antione Harrell for project management and domain expertise
- All electricians and field staff for their input on workflow optimization

---

**Built for MetroPower by Utak West**
