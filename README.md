# MetroPower Manpower Dashboard

## Project Overview

This repository contains the complete MetroPower Manpower Dashboard system, a comprehensive workforce management solution designed to solve critical issues with employee tracking, payroll accuracy, and resource allocation across multiple construction projects at MetroPower's Tucker Branch.

## Core Problem Addressed

Project managers currently cannot track real-time employee movements between job sites, leading to payroll discrepancies and unfair cost allocation when workers are reassigned mid-week without proper documentation.

## Repository Structure

```
MetroPower-Dashboard/
├── backend/            # Backend API server
│   ├── src/
│   │   ├── controllers/    # API endpoint handlers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth & validation
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Helper functions
│   │   ├── config/        # Configuration
│   │   └── migrations/    # Database migrations
│   ├── tests/             # Test suites
│   ├── docs/              # API documentation
│   ├── uploads/           # File uploads
│   └── exports/           # Generated exports
├── frontend/           # Frontend dashboard
│   ├── assets/
│   │   └── images/        # Dashboard images and icons
│   ├── css/
│   │   └── dashboard.css  # Main stylesheet
│   ├── js/
│   │   └── dashboard.js   # Dashboard functionality
│   └── index.html         # Main dashboard
├── docs/               # Project documentation
│   ├── brand_guidelines.md
│   ├── dashboard_requirements.md
│   ├── dashboard_design_best_practices.md
│   ├── dashboard_features_list.md
│   ├── dashboard_layout_concepts.md
│   ├── dashboard_workflow_templates.md
│   ├── database_schema.md
│   └── manpower_board_analysis.md
└── docker-compose.yml  # Development environment
```

## Key Features

1. **Visual Workforce Placement Board**: Grid showing daily employee assignments across all active projects
2. **Drag-and-Drop Assignment**: Intuitive interface for moving employees between projects and days
3. **Employee Quick Search**: Instant lookup by name or Employee ID
4. **Weekly Archive System**: Save and access historical assignment data
5. **Multi-Format Export**: Generate Excel, CSV, and Markdown files for payroll reconciliation
6. **Email Notification System**: Automated alerts when employee assignments change
7. **Mobile Responsive Design**: Access from any device in the field or office

## 🚀 Quick Start

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

### 🔐 Default Login Credentials

After running the seed script, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@metropower.com | MetroPower2025! |
| Project Manager | antoine.harrell@metropower.com | MetroPower2025! |
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
