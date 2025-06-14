# Database Schema for MetroPower Manpower Dashboard

## Core Tables

### 1. Employees
```
Table: employees
- employee_id (PK): VARCHAR(10) - Unique identifier for each employee
- name: VARCHAR(100) - Full name of employee
- position_id (FK): INT - Reference to positions table
- status: ENUM('Active', 'PTO', 'Leave', 'Military', 'Terminated') - Current status
- employee_number: VARCHAR(20) - Employee number from ADP system
- hire_date: DATE - Date employee was hired
- notes: TEXT - Additional employee information
- created_at: TIMESTAMP - Record creation timestamp
- updated_at: TIMESTAMP - Record last update timestamp
```

### 2. Positions/Trades
```
Table: positions
- position_id (PK): INT - Unique identifier for position
- name: VARCHAR(50) - Position name (Electrician, Field Supervisor, etc.)
- code: VARCHAR(10) - Short code for position (FS, GL, etc.)
- color_code: VARCHAR(7) - Hex color code for visual representation
- description: TEXT - Detailed description of position
- created_at: TIMESTAMP - Record creation timestamp
- updated_at: TIMESTAMP - Record last update timestamp
```

### 3. Projects
```
Table: projects
- project_id (PK): VARCHAR(20) - Unique identifier for project
- name: VARCHAR(100) - Project name
- number: VARCHAR(20) - Project number
- status: ENUM('Active', 'Completed', 'On Hold', 'Planned') - Project status
- start_date: DATE - Project start date
- end_date: DATE - Projected or actual end date
- location: VARCHAR(100) - Project location
- manager_id (FK): INT - Reference to users table (project manager)
- description: TEXT - Project description
- created_at: TIMESTAMP - Record creation timestamp
- updated_at: TIMESTAMP - Record last update timestamp
```

### 4. Assignments
```
Table: assignments
- assignment_id (PK): INT - Unique identifier for assignment
- employee_id (FK): VARCHAR(10) - Reference to employees table
- project_id (FK): VARCHAR(20) - Reference to projects table
- assignment_date: DATE - Date of assignment
- created_by (FK): INT - User who created assignment
- updated_by (FK): INT - User who last updated assignment
- created_at: TIMESTAMP - Record creation timestamp
- updated_at: TIMESTAMP - Record last update timestamp
```

### 5. Users
```
Table: users
- user_id (PK): INT - Unique identifier for user
- username: VARCHAR(50) - Username for login
- email: VARCHAR(100) - Email address
- password_hash: VARCHAR(255) - Hashed password
- first_name: VARCHAR(50) - First name
- last_name: VARCHAR(50) - Last name
- role: ENUM('Admin', 'Project Manager', 'Branch Manager', 'HR', 'View Only') - User role
- last_login: TIMESTAMP - Last login timestamp
- created_at: TIMESTAMP - Record creation timestamp
- updated_at: TIMESTAMP - Record last update timestamp
```

## Supporting Tables

### 6. Notifications
```
Table: notifications
- notification_id (PK): INT - Unique identifier for notification
- type: ENUM('Assignment Change', 'Daily Summary', 'Exception Alert') - Notification type
- recipient_id (FK): INT - Reference to users table
- content: TEXT - Notification content
- related_assignment_id (FK): INT - Reference to assignments table (if applicable)
- read_status: BOOLEAN - Whether notification has been read
- sent_at: TIMESTAMP - When notification was sent
- created_at: TIMESTAMP - Record creation timestamp
```

### 7. Assignment History
```
Table: assignment_history
- history_id (PK): INT - Unique identifier for history record
- assignment_id (FK): INT - Reference to assignments table
- employee_id (FK): VARCHAR(10) - Reference to employees table
- previous_project_id (FK): VARCHAR(20) - Previous project assignment
- new_project_id (FK): VARCHAR(20) - New project assignment
- assignment_date: DATE - Date of assignment
- change_reason: VARCHAR(255) - Reason for assignment change
- changed_by (FK): INT - User who made the change
- changed_at: TIMESTAMP - When change was made
```

### 8. Exports
```
Table: exports
- export_id (PK): INT - Unique identifier for export
- user_id (FK): INT - Reference to users table
- type: ENUM('Excel', 'CSV', 'Markdown', 'PDF') - Export format
- parameters: JSON - Export parameters and filters
- file_path: VARCHAR(255) - Path to exported file
- status: ENUM('Pending', 'Completed', 'Failed') - Export status
- created_at: TIMESTAMP - Record creation timestamp
- completed_at: TIMESTAMP - When export was completed
```

### 9. Weekly Archives
```
Table: weekly_archives
- archive_id (PK): INT - Unique identifier for archive
- week_start_date: DATE - Start date of archived week
- week_end_date: DATE - End date of archived week
- archive_data: JSON - Snapshot of all assignments for the week
- created_by (FK): INT - User who created archive
- created_at: TIMESTAMP - Record creation timestamp
```

### 10. User Preferences
```
Table: user_preferences
- preference_id (PK): INT - Unique identifier for preference
- user_id (FK): INT - Reference to users table
- preference_key: VARCHAR(50) - Preference identifier
- preference_value: TEXT - Preference value
- created_at: TIMESTAMP - Record creation timestamp
- updated_at: TIMESTAMP - Record last update timestamp
```

## Relationships

1. **Employees to Positions**: Many-to-One (Each employee has one position/trade)
2. **Assignments to Employees**: Many-to-One (Each assignment belongs to one employee)
3. **Assignments to Projects**: Many-to-One (Each assignment belongs to one project)
4. **Projects to Users**: Many-to-One (Each project has one project manager)
5. **Assignments to Users**: Many-to-One (Each assignment created/updated by users)
6. **Notifications to Users**: Many-to-One (Each notification sent to one user)
7. **Assignment History to Assignments**: Many-to-One (Each history record relates to one assignment)
8. **Exports to Users**: Many-to-One (Each export created by one user)
9. **Weekly Archives to Users**: Many-to-One (Each archive created by one user)
10. **User Preferences to Users**: Many-to-One (Each preference belongs to one user)

## Indexes

- employees: employee_id, position_id, status
- positions: name
- projects: project_id, status, manager_id
- assignments: employee_id, project_id, assignment_date
- users: email, role
- notifications: recipient_id, read_status
- assignment_history: assignment_id, employee_id, changed_at
- weekly_archives: week_start_date, week_end_date

## Constraints

- Unique constraint on assignments: (employee_id, assignment_date) to prevent double-booking
- Foreign key constraints on all relationships to maintain referential integrity
- Check constraints on date fields to ensure logical date ranges
- Not null constraints on critical fields
