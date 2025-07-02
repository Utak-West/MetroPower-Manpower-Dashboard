# MetroPower Dashboard - Noloco + Airtable Solution

A professional workforce management system for MetroPower's Tucker Branch electrical contracting operations. Built on Noloco (frontend) and Airtable (database) for maximum reliability, ease of use, and rapid deployment.

## Project Overview

This repository contains the complete MetroPower Dashboard migration from Next.js/Vercel to a robust Noloco + Airtable architecture. The system manages 50+ employees across 11+ active projects with comprehensive assignment scheduling, reporting, and mobile access for field operations.

## Core Problem Addressed

The MetroPower Tucker Branch faced significant challenges with:
- **Payroll Discrepancies**: Manual tracking led to inconsistencies between field assignments and payroll records
- **Resource Allocation**: Difficulty in optimizing employee assignments across multiple projects
- **Real-time Visibility**: Lack of instant access to employee locations and project status
- **Cost Allocation**: Inaccurate project cost distribution affecting profitability analysis
- **System Reliability**: Previous Next.js solution had critical API failures preventing business operations

## Solution Architecture

### No-Code Platform Benefits
- **Noloco Frontend**: Professional interface builder with drag-and-drop components
- **Airtable Database**: Robust, scalable database with built-in relationships and validation
- **Zero Maintenance**: Managed services eliminate server management and API debugging
- **Rapid Deployment**: 2-3 weeks to full functionality vs 6+ weeks for custom development
- **Cost Effective**: $708-828/year total cost vs ongoing development expenses

### Key Features
- **Employee Management**: Complete CRUD operations for 50+ workforce members
- **Project Tracking**: Visual project management with timeline and status tracking
- **Assignment Scheduling**: Drag-and-drop daily assignment interface with conflict detection
- **Mobile Access**: Fully responsive design for field supervisor and employee access
- **Professional Reporting**: Excel/PDF exports with MetroPower branding
- **Role-Based Security**: Manager, Field Supervisor, and Employee access levels

## Technology Stack

### Frontend Platform
- **Noloco Professional**: No-code interface builder
- **Custom Branding**: MetroPower logo, colors, and styling
- **Responsive Design**: Mobile-optimized for field access
- **Component Library**: Pre-built dashboard, forms, and data visualization components

### Database Platform
- **Airtable Pro**: Cloud-based relational database
- **Advanced Features**: Formulas, lookups, rollups, and automation
- **API Integration**: RESTful API for Noloco connectivity
- **Data Validation**: Built-in field validation and relationship integrity

### Infrastructure
- **Noloco Cloud**: Managed hosting with 99.9% uptime SLA
- **Airtable Cloud**: Enterprise-grade data storage and backup
- **Custom Domain**: Professional URL (dashboard.metropower.com)
- **SSL Security**: Automatic HTTPS encryption

## Implementation Guide

### Prerequisites
- Noloco Professional account ($59/month)
- Airtable Pro account ($20/month)
- MetroPower logo file (provided in assets/branding/)
- Employee data files (Excel format)

### Quick Start Implementation

1. **Set Up Airtable Base**
```
Follow: docs/airtable-configuration.md
- Create "MetroPower Workforce Management" base
- Configure 5 tables: Employees, Projects, Assignments, Positions, Time Tracking
- Import employee data from Excel files
- Set up relationships and views
```

2. **Create Noloco Application**
```
Follow: docs/noloco-setup-guide.md
- Sign up for Noloco Professional
- Connect to Airtable base
- Build interface pages: Dashboard, Staff, Projects, Assignments, Reports
- Configure user authentication and permissions
```

3. **Configure User Access**
```
Manager Access: antione.harrell@metropower.com
- Full administrative permissions
- All CRUD operations
- Report generation access
- User management capabilities
```

4. **Deploy and Test**
```
- Custom domain setup (optional)
- Mobile responsiveness verification
- Data import validation
- User training completion
```

The application will be available at:
- **Dashboard**: https://metropower-dashboard.noloco.app
- **Custom Domain**: https://dashboard.metropower.com (optional)
- **Mobile Access**: Fully responsive on all devices

## Configuration Files

### Airtable Schema Configuration
```json
File: config/airtable-schema.json
Contains complete table definitions, field specifications, and relationship mappings
for the MetroPower Workforce Management base.
```

### Noloco Component Configuration
```json
File: config/noloco-components.json
Defines all interface components, page layouts, and user interaction elements
for the dashboard application.
```

### User Permissions Configuration
```json
File: config/user-permissions.json
Specifies role-based access control settings for Manager, Field Supervisor,
and Employee user types.
```

### Branding Assets
```
Directory: assets/branding/
- metropower-logo.png (primary logo)
- favicon.ico (website icon)
- brand-guidelines.md (color codes and styling)
```

### Data Import Templates
```
Directory: assets/data/
- employee-import-template.csv (employee data format)
- project-import-template.csv (project data format)
```

## System Features

### Dashboard Overview
- Real-time employee and project statistics
- Today's assignment overview with status indicators
- Unassigned employee alerts and quick assignment actions
- Weekly assignment calendar with drag-and-drop scheduling
- Export capabilities for Excel and PDF reports

### Employee Management
- Complete employee directory with search and filtering
- Employee profiles with contact information, skills, and certifications
- Position-based organization and pay rate management
- Hire date tracking and employment status management
- Emergency contact information and notes

### Project Management
- Active project tracking with timeline visualization
- Project status monitoring and completion percentage
- Budget tracking and cost allocation (manager access only)
- Location and client information management
- Project assignment overview and employee allocation

### Assignment Scheduling
- Daily and weekly assignment calendar views
- Drag-and-drop employee assignment interface
- Conflict detection for double-booked employees
- Task description and location specification
- Time tracking with regular and overtime hours
- Weather condition and equipment usage logging

### Reporting and Analytics
- Employee roster exports with contact information
- Project status reports with completion metrics
- Weekly assignment summaries for payroll processing
- Time tracking reports with pay calculations
- Custom date range reporting capabilities

## Implementation Timeline

### Phase 1: Foundation (Days 1-2)
- Set up Airtable base with all tables and relationships
- Import employee data from Excel files
- Configure basic views and validation rules

### Phase 2: Interface Development (Days 3-7)
- Create Noloco application and connect to Airtable
- Build dashboard with statistics and quick actions
- Develop employee management interface with search and filtering
- Create project management pages with timeline views

### Phase 3: Advanced Features (Days 8-12)
- Implement assignment scheduling with calendar interface
- Configure reporting and export capabilities
- Set up user authentication and role-based permissions
- Apply MetroPower branding and custom styling

### Phase 4: Testing and Deployment (Days 13-14)
- Comprehensive functionality testing
- Mobile responsiveness verification
- User training for Antione Harrell
- Go-live and production deployment

## User Access and Permissions

### Manager Access (Antione Harrell)
- **Email**: antione.harrell@metropower.com
- **Permissions**: Full administrative access
- **Capabilities**: All CRUD operations, report generation, user management

### Field Supervisor Access
- **Permissions**: Project-specific access
- **Capabilities**: View assigned employees, update assignment status, limited reporting

### Employee Access
- **Permissions**: View-only for personal assignments
- **Capabilities**: View schedule, project details, update time entries

## Security and Compliance

- **Data Encryption**: All data encrypted in transit and at rest
- **Access Control**: Role-based permissions with audit trails
- **Backup Systems**: Automatic daily backups with point-in-time recovery
- **Compliance**: SOC 2 Type II certified platforms (Noloco and Airtable)
- **Privacy**: GDPR and CCPA compliant data handling

## Cost Analysis

### Monthly Costs
- **Airtable Pro**: $20/month
- **Noloco Professional**: $59/month
- **Custom Domain** (optional): $10/month
- **Total**: $79-89/month

### Annual Investment
- **Year 1 Total**: $708-828
- **ROI**: Positive within 3 months through improved efficiency
- **Savings**: Eliminates ongoing development and maintenance costs

## Support and Maintenance

### Noloco Support
- **24/7 Platform Support**: Included with Professional plan
- **Documentation**: Comprehensive help center and tutorials
- **Community**: Active user community and forums

### Airtable Support
- **Business Support**: Email and chat support included
- **Training Resources**: Extensive documentation and video tutorials
- **API Documentation**: Complete REST API reference

### Implementation Support
- **Primary Contact**: Antione Harrell (antione.harrell@metropower.com)
- **Technical Documentation**: Complete setup guides in docs/ folder
- **Training Materials**: User guides and video tutorials included

## Migration from Next.js/Vercel

### Legacy System Archive
- **Location**: archive/nextjs-legacy/
- **Purpose**: Reference only - not functional
- **Status**: Deprecated due to critical API failures

### Data Preservation
- **Employee Records**: Migrated to Airtable Employees table
- **Project Data**: Transferred to Airtable Projects table
- **Assignment History**: Preserved in Airtable Assignments table
- **Backup Files**: Excel exports available in assets/data/

## License

Copyright 2025 The HigherSelf Network. All rights reserved.

## Contact

For support or questions, contact: info@higherselflife.com
