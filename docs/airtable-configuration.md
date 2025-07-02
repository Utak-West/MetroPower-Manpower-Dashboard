# Airtable Configuration Guide - MetroPower Dashboard

## Overview
This guide provides step-by-step instructions for setting up the complete Airtable base for the MetroPower Workforce Management system.

## Prerequisites
- Airtable Pro account ($20/month)
- Access to MetroPower employee data files
- MetroPower logo and branding assets

## Step 1: Create New Airtable Base

### 1.1 Initial Setup
1. Go to [airtable.com](https://airtable.com) and log in
2. Click "Create a base" → "Start from scratch"
3. **Base Name**: "MetroPower Workforce Management"
4. **Workspace**: Create "MetroPower" workspace if it doesn't exist
5. **Icon**: Choose construction/tools icon
6. **Color**: Blue (#1e3a8a)

### 1.2 Base Description
```
Complete workforce management system for MetroPower electrical contracting operations.
Manages 50+ employees across 11+ active projects with comprehensive assignment 
scheduling, reporting, and mobile access for field operations.
```

## Step 2: Create Tables

### Table 1: Employees

#### 2.1 Create Employees Table
1. Rename default table to "Employees"
2. Set primary field to "Full Name"

#### 2.2 Add Fields (Copy-Paste Ready)
```
Field Name: Employee ID
Type: Single line text
Options: Required, Unique
Description: Unique identifier (format: EMP-001)

Field Name: Full Name  
Type: Single line text
Options: Required
Description: First and Last Name

Field Name: First Name
Type: Single line text
Options: Required

Field Name: Last Name
Type: Single line text
Options: Required

Field Name: Position
Type: Single select
Options: 
- Apprentice (Blue)
- Electrician (Green) 
- Field Supervisor (Orange)
- General Laborer (Gray)
- Service Tech (Purple)
- Temp (Yellow)
- Foreman (Red)
- Lineman (Teal)
Required: Yes

Field Name: Email
Type: Email
Options: Not required

Field Name: Phone
Type: Phone number
Options: Required

Field Name: Hire Date
Type: Date
Format: US (MM/DD/YYYY)
Options: Required

Field Name: Status
Type: Single select
Options:
- Active (Green) - Default
- Inactive (Red)
- Vacation (Blue)
- Medical (Orange)
- Military (Purple)

Field Name: Skills
Type: Multiple select
Options:
- Electrical Wiring (Blue)
- Panel Installation (Green)
- Conduit Running (Orange)
- Troubleshooting (Red)
- Safety Certified (Yellow)
- Equipment Operation (Purple)
- Blueprint Reading (Teal)

Field Name: Emergency Contact Name
Type: Single line text

Field Name: Emergency Contact Phone
Type: Phone number

Field Name: Pay Rate
Type: Currency
Symbol: $
Precision: 2 decimal places

Field Name: Notes
Type: Long text

Field Name: Profile Photo
Type: Attachment

Field Name: Years Experience
Type: Number
Precision: 1 decimal place

Field Name: Certifications
Type: Multiple select
Options:
- OSHA 10 (Green)
- OSHA 30 (Blue)
- Electrical License (Orange)
- First Aid/CPR (Red)

Field Name: Created Date
Type: Created time

Field Name: Last Modified
Type: Last modified time
```

#### 2.3 Create Employee Views
1. **All Active Employees**
   - Filter: Status = "Active"
   - Sort: Last Name (A→Z)
   - Fields: Full Name, Position, Phone, Email, Status

2. **By Position**
   - Group by: Position
   - Sort: Position (A→Z)

3. **New Hires (Last 90 Days)**
   - Filter: `IS_AFTER({Hire Date}, DATEADD(TODAY(), -90, 'days'))`
   - Sort: Hire Date (newest first)

4. **Inactive Employees**
   - Filter: Status ≠ "Active"

5. **Contact List**
   - Fields: Full Name, Phone, Email, Emergency Contact Name, Emergency Contact Phone

### Table 2: Projects

#### 2.4 Create Projects Table
1. Click "Add a table" → "Start from scratch"
2. **Table Name**: "Projects"
3. **Primary Field**: "Project Name"

#### 2.5 Add Project Fields (Copy-Paste Ready)
```
Field Name: Project Name
Type: Single line text
Options: Required

Field Name: Project ID
Type: Single line text
Options: Required, Unique
Description: Format: PRJ-2025-001

Field Name: Location/Address
Type: Single line text
Options: Required

Field Name: Start Date
Type: Date
Format: US (MM/DD/YYYY)
Options: Required

Field Name: End Date
Type: Date
Format: US (MM/DD/YYYY)

Field Name: Status
Type: Single select
Options:
- Planning (Yellow)
- Active (Green) - Default
- On Hold (Orange)
- Completed (Blue)
- Cancelled (Red)

Field Name: Project Manager
Type: Single line text
Default: Antione Harrell

Field Name: Budget
Type: Currency
Symbol: $
Precision: 2 decimal places

Field Name: Description
Type: Long text

Field Name: Client Name
Type: Single line text

Field Name: Priority
Type: Single select
Options:
- Low (Gray)
- Medium (Yellow) - Default
- High (Orange)
- Critical (Red)

Field Name: Completion Percentage
Type: Percent
Precision: 0 decimal places

Field Name: Estimated Hours
Type: Number
Precision: 0 decimal places

Field Name: Notes
Type: Long text

Field Name: Created Date
Type: Created time

Field Name: Last Modified
Type: Last modified time
```

#### 2.6 Create Project Views
1. **Active Projects**
   - Filter: Status = "Active"
   - Sort: Priority (Z→A)

2. **By Priority**
   - Group by: Priority
   - Sort: Priority (Z→A)

3. **Ending Soon (30 Days)**
   - Filter: `IS_BEFORE({End Date}, DATEADD(TODAY(), 30, 'days'))`
   - Sort: End Date (earliest first)

4. **Project Timeline**
   - View type: Calendar
   - Date field: Start Date
   - Color by: Status

5. **Completed Projects**
   - Filter: Status = "Completed"
   - Sort: End Date (newest first)

## Step 3: Sample Data Entry

### 3.1 Sample Employees (Enter These First)
```
Employee ID: EMP-001
Full Name: John Smith
First Name: John
Last Name: Smith
Position: Electrician
Email: john.smith@metropower.com
Phone: (770) 555-0101
Hire Date: 01/15/2023
Status: Active
Pay Rate: $28.00

Employee ID: EMP-002
Full Name: Sarah Johnson
First Name: Sarah
Last Name: Johnson
Position: Field Supervisor
Email: sarah.johnson@metropower.com
Phone: (770) 555-0102
Hire Date: 03/10/2022
Status: Active
Pay Rate: $35.00

Employee ID: EMP-003
Full Name: Mike Davis
First Name: Mike
Last Name: Davis
Position: Apprentice
Email: mike.davis@metropower.com
Phone: (770) 555-0103
Hire Date: 06/01/2024
Status: Active
Pay Rate: $18.00
```

### 3.2 Sample Projects (Enter These Second)
```
Project Name: Tucker Mall Renovation
Project ID: PRJ-2025-001
Location/Address: 4166 Lavista Rd, Tucker, GA 30084
Start Date: 01/15/2025
End Date: 06/30/2025
Status: Active
Project Manager: Antione Harrell
Budget: $125,000.00
Priority: High

Project Name: Office Complex Wiring
Project ID: PRJ-2025-002
Location/Address: 1234 Business Blvd, Tucker, GA 30084
Start Date: 02/01/2025
End Date: 04/15/2025
Status: Active
Project Manager: Antione Harrell
Budget: $85,000.00
Priority: Medium

Project Name: Residential Development
Project ID: PRJ-2025-003
Location/Address: 5678 Residential Way, Tucker, GA 30084
Start Date: 03/01/2025
End Date: 08/31/2025
Status: Planning
Project Manager: Antione Harrell
Budget: $200,000.00
Priority: Medium
```

## Step 4: Validation Checklist

### 4.1 Data Validation
- [ ] All required fields marked as required
- [ ] Unique fields (Employee ID, Project ID) set to unique
- [ ] Default values set correctly
- [ ] Date formats consistent (US format)
- [ ] Currency fields show $ symbol
- [ ] Single select options have appropriate colors

### 4.2 Views Validation
- [ ] All Active Employees view shows only active employees
- [ ] By Position view groups employees correctly
- [ ] Active Projects view shows only active projects
- [ ] Calendar views display dates correctly

### 4.3 Sample Data Validation
- [ ] Sample employees created successfully
- [ ] Sample projects created successfully
- [ ] All fields populated correctly
- [ ] No validation errors

## Next Steps
1. Proceed to data migration (see data-migration-procedures.md)
2. Set up remaining tables (Assignments, Positions, Time Tracking)
3. Configure Noloco connection (see noloco-setup-guide.md)
