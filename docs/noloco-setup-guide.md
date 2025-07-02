# Noloco Setup Guide - MetroPower Dashboard

## Overview
Complete step-by-step guide for building the MetroPower Dashboard interface using Noloco Professional.

## Prerequisites
- Noloco Professional account ($59/month)
- Completed Airtable base (see airtable-configuration.md)
- MetroPower logo file ready for upload

## Phase 1: Initial Noloco Setup

### Step 1.1: Create Noloco Account
1. Go to [noloco.io](https://noloco.io)
2. Click "Start Free Trial" or "Sign Up"
3. Choose "Professional Plan" ($59/month)
4. Complete account registration

### Step 1.2: Create New Application
1. Click "Create New App"
2. **App Name**: MetroPower Dashboard
3. **Description**: Workforce management system for MetroPower Tucker Branch
4. Click "Create App"

### Step 1.3: Connect to Airtable
1. In app settings, click "Data Sources"
2. Click "Add Data Source" → "Airtable"
3. Click "Connect to Airtable"
4. Authorize Noloco to access your Airtable account
5. Select base: "MetroPower Workforce Management"
6. Import all tables:
   - ✅ Employees
   - ✅ Projects  
   - ✅ Assignments
   - ✅ Positions
   - ✅ Time Tracking
7. Click "Import Tables"

### Step 1.4: Configure App Settings
```
App Configuration (Copy these exact settings):

General Settings:
- App Name: MetroPower Dashboard
- Subdomain: metropower-dashboard
- Description: Professional workforce management for MetroPower electrical contracting

Branding:
- Primary Color: #1e3a8a
- Secondary Color: #f59e0b  
- Background Color: #f8fafc
- Text Color: #1f2937
- Success Color: #10b981
- Warning Color: #f59e0b
- Error Color: #ef4444

Typography:
- Font Family: Inter
- Header Font Size: 24px
- Body Font Size: 16px
- Small Font Size: 14px

Layout:
- Layout Type: Full Width
- Navigation: Top Navigation
- Sidebar: Disabled
- Footer: Custom Footer
```

## Phase 2: Build Dashboard Page

### Step 2.1: Create Dashboard Page
1. Click "Pages" → "Add Page"
2. **Page Name**: Dashboard
3. **URL**: /dashboard
4. **Layout**: Full Width
5. **Access**: Logged-in users only
6. Click "Create Page"

### Step 2.2: Add Header Component
1. Click "Add Component" → "Custom HTML"
2. **Component Name**: MetroPower Header
3. **HTML Content** (copy exactly):
```html
<div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
  <div style="display: flex; align-items: center;">
    <img src="[UPLOAD_LOGO_HERE]" alt="MetroPower" style="height: 40px; margin-right: 15px; border-radius: 8px;">
    <div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">MetroPower Dashboard</h1>
      <p style="margin: 0; opacity: 0.9; font-size: 14px;">Tucker Branch - Workforce Management</p>
    </div>
  </div>
  <div style="text-align: right;">
    <p style="margin: 0; font-weight: 600;">Welcome, {{current_user.email}}</p>
    <p style="margin: 0; font-size: 14px; opacity: 0.8;">{{current_date}}</p>
  </div>
</div>
```

### Step 2.3: Add Statistics Cards
1. Click "Add Component" → "Metrics"
2. **Component Name**: Dashboard Statistics
3. **Layout**: 4 Columns

**Metric 1: Total Active Employees**
```
Title: Total Active Employees
Data Source: Employees
Chart Type: Number
Filter: Status = "Active"
Color: #10b981 (Green)
Icon: users
```

**Metric 2: Active Projects**
```
Title: Active Projects  
Data Source: Projects
Chart Type: Number
Filter: Status = "Active"
Color: #3b82f6 (Blue)
Icon: briefcase
```

**Metric 3: Today's Assignments**
```
Title: Today's Assignments
Data Source: Assignments
Chart Type: Number
Filter: IS_SAME({Assignment Date}, TODAY(), 'day')
Color: #f59e0b (Orange)
Icon: calendar
```

**Metric 4: Unassigned Today**
```
Title: Unassigned Today
Data Source: Assignments  
Chart Type: Number
Filter: AND(IS_SAME({Assignment Date}, TODAY(), 'day'), Status = "Assigned")
Color: #ef4444 (Red)
Icon: alert-triangle
```

### Step 2.4: Add Quick Actions
1. Click "Add Component" → "Button Group"
2. **Component Name**: Quick Actions
3. **Layout**: Horizontal

**Button 1: Manage Assignments**
```
Text: Manage Assignments
Action: Navigate to Page
Target: /assignments
Style: Primary
Icon: calendar-plus
```

**Button 2: View Staff**
```
Text: View Staff
Action: Navigate to Page  
Target: /employees
Style: Secondary
Icon: users
```

**Button 3: Projects**
```
Text: Projects
Action: Navigate to Page
Target: /projects  
Style: Secondary
Icon: briefcase
```

**Button 4: Reports**
```
Text: Reports
Action: Navigate to Page
Target: /reports
Style: Secondary  
Icon: file-text
```

### Step 2.5: Add Today's Assignments Table
1. Click "Add Component" → "Table"
2. **Component Name**: Today's Assignments
3. **Data Source**: Assignments
4. **View**: Today's Assignments (create this view in Airtable first)

**Table Configuration:**
```
Title: Today's Assignments
Fields to Display:
- Employee (Link to Employees)
- Project (Link to Projects)  
- Task Description
- Status
- Start Time
- Location

Styling:
- Compact Rows: Yes
- Alternating Colors: Yes
- Header Style: Bold
- Max Rows: 10

Actions:
- Edit (Managers only)
- View Details (All users)
```

## Phase 3: Build Employee Management Page

### Step 3.1: Create Employees Page
1. Click "Pages" → "Add Page"
2. **Page Name**: Staff Management
3. **URL**: /employees
4. **Access**: Managers and Field Supervisors
5. Click "Create Page"

### Step 3.2: Add Page Header
1. Click "Add Component" → "Page Header"
2. **Title**: Staff Management
3. **Subtitle**: Manage MetroPower workforce - Tucker Branch

**Add Action Button:**
```
Text: Add New Employee
Action: Open Form
Target: Add Employee Form
Style: Primary
Icon: user-plus
Permissions: Managers only
```

### Step 3.3: Add Filter Bar
1. Click "Add Component" → "Filters"
2. **Component Name**: Employee Filters

**Filter 1: Position**
```
Field: Position
Type: Dropdown
Source: Get options from Employees table
Placeholder: Filter by Position
```

**Filter 2: Status**
```
Field: Status
Type: Dropdown
Options: Active, Inactive, Vacation, Medical, Military
Placeholder: Filter by Status
```

**Filter 3: Name Search**
```
Field: Full Name
Type: Text Input
Placeholder: Search by name
```

**Filter 4: Hire Date**
```
Field: Hire Date
Type: Date Range
Placeholder: Hire date range
```

### Step 3.4: Add Employee Cards
1. Click "Add Component" → "Cards"
2. **Component Name**: Employee Directory
3. **Data Source**: Employees
4. **View**: All Active Employees

**Card Configuration:**
```
Cards Per Row: 3
Card Spacing: Medium
Shadow Level: Light

Card Layout:
- Profile Photo: Profile Photo field
- Title: Full Name
- Subtitle: Position  
- Fields: Phone, Email, Status, Years Experience
- Badges: Position (colored), Status (colored)

Actions per Card:
- View Details (All users)
- Edit (Managers only)
- Assign to Project (Managers only)
```

### Step 3.5: Add Employee Form
1. Click "Add Component" → "Form"
2. **Component Name**: Add Employee Form
3. **Data Source**: Employees

**Form Fields (in order):**
```
1. Employee ID (Required)
2. First Name (Required)  
3. Last Name (Required)
4. Position (Required, Dropdown)
5. Email
6. Phone (Required)
7. Hire Date (Required)
8. Status (Dropdown, Default: Active)
9. Skills (Multiple select)
10. Emergency Contact Name
11. Emergency Contact Phone
12. Pay Rate
13. Notes
```

**Form Validation:**
```
Required Fields: Employee ID, First Name, Last Name, Position, Phone, Hire Date
Email Format: Email field
Phone Format: Phone field
Unique Check: Employee ID
```

**Success Action:**
```
Action: Return to Employee List
Message: "Employee added successfully!"
```

## Phase 4: Testing and Validation

### Step 4.1: Dashboard Testing
- [ ] Header displays correctly with MetroPower branding
- [ ] Statistics cards show correct numbers
- [ ] Quick action buttons navigate properly
- [ ] Today's assignments table loads data
- [ ] Mobile responsive layout works

### Step 4.2: Employee Management Testing  
- [ ] Employee cards display correctly
- [ ] Filters work properly
- [ ] Add employee form validates correctly
- [ ] Edit functionality works (managers only)
- [ ] Search functionality works

### Step 4.3: Data Connection Testing
- [ ] Airtable data loads correctly
- [ ] Real-time updates work
- [ ] Relationships between tables work
- [ ] Filters apply correctly

## Phase 5: User Authentication Setup

### Step 5.1: Configure Authentication
1. Go to "Settings" → "Authentication"
2. **Authentication Method**: Email/Password
3. **Signup**: Disabled (Invite only)
4. **Email Verification**: Required

**Password Requirements:**
```
Minimum Length: 8 characters
Require Uppercase: Yes
Require Lowercase: Yes  
Require Numbers: Yes
Require Special Characters: No
```

### Step 5.2: Create User Roles
1. Go to "Settings" → "User Groups"
2. Create three roles:

**Manager Role:**
```
Name: Manager
Description: Full administrative access
Permissions: All pages, all CRUD operations
```

**Field Supervisor Role:**
```
Name: Field Supervisor  
Description: Project-specific access
Permissions: Limited to assigned projects
```

**Employee Role:**
```
Name: Employee
Description: View personal assignments only
Permissions: Read-only for own data
```

### Step 5.3: Add Antione Harrell
1. Go to "Users" → "Add User"
2. **Email**: antione.harrell@metropower.com
3. **Role**: Manager
4. **First Name**: Antione
5. **Last Name**: Harrell
6. **Send Invitation**: Yes

## Next Steps
1. Complete remaining pages (Projects, Assignments, Reports)
2. Apply MetroPower branding (see branding guide)
3. Import employee data (see data migration guide)
4. Conduct user training
