# Data Migration Procedures - MetroPower Dashboard

## Overview
Complete procedures for migrating existing MetroPower employee and project data from Excel files to the new Airtable + Noloco system.

## Source Data Files
- **Current Data**: `/Users/utakwest/Downloads/MB Week 6.30.25-7.6.25.xlsx`
- **Legacy Data**: `/Users/utakwest/Documents/HigherSelf/HigherSelf Partners/MetroPower/MetroPower Manpower Dashboard/Legacy - MB Week 6.16.25-6.22.25.xlsx`

## Phase 1: Data Preparation

### Step 1.1: Analyze Source Data
1. Open both Excel files
2. Identify data structure and columns
3. Map Excel columns to Airtable fields
4. Note any data inconsistencies or missing information

### Step 1.2: Clean and Standardize Data

**Employee Data Cleaning:**
```
Standardization Tasks:
- Ensure consistent name formatting (First Last)
- Standardize phone numbers: (XXX) XXX-XXXX
- Validate email addresses
- Convert dates to MM/DD/YYYY format
- Standardize position titles to match Airtable options
- Remove duplicate entries
- Fill in missing Employee IDs (format: EMP-001, EMP-002, etc.)
```

**Project Data Cleaning:**
```
Standardization Tasks:
- Ensure consistent project naming
- Standardize addresses
- Convert dates to MM/DD/YYYY format
- Assign Project IDs (format: PRJ-2025-001, PRJ-2025-002, etc.)
- Standardize status values to match Airtable options
- Set default Project Manager to "Antione Harrell"
```

### Step 1.3: Create Import Templates

**Employee Import Template (CSV format):**
```
Employee ID,Full Name,First Name,Last Name,Position,Email,Phone,Hire Date,Status,Pay Rate,Notes

Example rows:
EMP-001,John Smith,John,Smith,Electrician,john.smith@metropower.com,(770) 555-0101,01/15/2023,Active,28.00,
EMP-002,Sarah Johnson,Sarah,Johnson,Field Supervisor,sarah.johnson@metropower.com,(770) 555-0102,03/10/2022,Active,35.00,
EMP-003,Mike Davis,Mike,Davis,Apprentice,mike.davis@metropower.com,(770) 555-0103,06/01/2024,Active,18.00,
```

**Project Import Template (CSV format):**
```
Project Name,Project ID,Location/Address,Start Date,End Date,Status,Project Manager,Budget,Priority,Description

Example rows:
Tucker Mall Renovation,PRJ-2025-001,4166 Lavista Rd Tucker GA 30084,01/15/2025,06/30/2025,Active,Antione Harrell,125000,High,Complete electrical renovation
Office Complex Wiring,PRJ-2025-002,1234 Business Blvd Tucker GA 30084,02/01/2025,04/15/2025,Active,Antione Harrell,85000,Medium,New office building electrical
```

## Phase 2: Employee Data Migration

### Step 2.1: Extract Employee Data from Excel
1. Open current data file: `MB Week 6.30.25-7.6.25.xlsx`
2. Locate employee information (usually in first sheet or dedicated employee sheet)
3. Copy employee data to new spreadsheet

### Step 2.2: Map Excel Columns to Airtable Fields
```
Excel Column → Airtable Field Mapping:

Name/Employee Name → Full Name
Position/Title → Position
Phone/Phone Number → Phone
Email/Email Address → Email
Hire Date/Start Date → Hire Date
Status → Status
Rate/Pay Rate/Hourly Rate → Pay Rate

Additional fields to add:
- Employee ID: Generate as EMP-001, EMP-002, etc.
- First Name: Extract from Full Name
- Last Name: Extract from Full Name
- Status: Default to "Active" if not specified
```

### Step 2.3: Data Transformation Steps
1. **Generate Employee IDs**:
   - Start with EMP-001
   - Increment for each employee (EMP-002, EMP-003, etc.)
   - Ensure no duplicates

2. **Split Full Names**:
   - Extract first name (everything before last space)
   - Extract last name (everything after last space)
   - Handle middle names/initials appropriately

3. **Standardize Positions**:
   ```
   Map variations to standard positions:
   "Electrician" → Electrician
   "Apprentice Electrician" → Apprentice
   "Supervisor" → Field Supervisor
   "Laborer" → General Laborer
   "Service Technician" → Service Tech
   "Temporary" → Temp
   "Foreman" → Foreman
   "Lineman" → Lineman
   ```

4. **Format Phone Numbers**:
   - Convert all to (XXX) XXX-XXXX format
   - Remove any extensions
   - Validate 10-digit numbers

5. **Validate Email Addresses**:
   - Check for proper email format
   - Add @metropower.com if missing domain
   - Flag invalid emails for manual review

### Step 2.4: Import to Airtable
1. Save cleaned data as CSV file
2. In Airtable Employees table, click "Import" → "CSV file"
3. Upload the CSV file
4. Map CSV columns to Airtable fields:
   ```
   CSV Column → Airtable Field
   Employee ID → Employee ID
   Full Name → Full Name
   First Name → First Name
   Last Name → Last Name
   Position → Position
   Email → Email
   Phone → Phone
   Hire Date → Hire Date
   Status → Status
   Pay Rate → Pay Rate
   Notes → Notes
   ```
5. Review mapping and click "Import"
6. Verify all records imported correctly

## Phase 3: Project Data Migration

### Step 3.1: Extract Project Data
1. Review both Excel files for project information
2. Look for project names, locations, dates, and assignments
3. Create comprehensive project list

### Step 3.2: Create Project Records
**Sample Projects Based on MetroPower Operations:**
```
Project 1:
Name: Tucker Mall Renovation
ID: PRJ-2025-001
Location: 4166 Lavista Rd, Tucker, GA 30084
Start Date: 01/15/2025
End Date: 06/30/2025
Status: Active
Manager: Antione Harrell
Budget: $125,000
Priority: High

Project 2:
Name: Office Complex Wiring
ID: PRJ-2025-002
Location: 1234 Business Blvd, Tucker, GA 30084
Start Date: 02/01/2025
End Date: 04/15/2025
Status: Active
Manager: Antione Harrell
Budget: $85,000
Priority: Medium

Project 3:
Name: Residential Development Phase 1
ID: PRJ-2025-003
Location: 5678 Residential Way, Tucker, GA 30084
Start Date: 03/01/2025
End Date: 08/31/2025
Status: Planning
Manager: Antione Harrell
Budget: $200,000
Priority: Medium

Project 4:
Name: Industrial Facility Upgrade
ID: PRJ-2025-004
Location: 9012 Industrial Dr, Tucker, GA 30084
Start Date: 04/01/2025
End Date: 07/15/2025
Status: Planning
Manager: Antione Harrell
Budget: $150,000
Priority: High

Project 5:
Name: School District Maintenance
ID: PRJ-2025-005
Location: Various Tucker Schools
Start Date: 01/01/2025
End Date: 12/31/2025
Status: Active
Manager: Antione Harrell
Budget: $75,000
Priority: Medium
```

### Step 3.3: Import Projects to Airtable
1. Create CSV file with project data
2. Import to Projects table using same process as employees
3. Verify all projects imported correctly

## Phase 4: Assignment Data Migration

### Step 4.1: Extract Assignment Data
1. Look for assignment/scheduling data in Excel files
2. Identify employee-to-project assignments
3. Note dates, tasks, and locations

### Step 4.2: Create Assignment Records
**Sample Assignment Structure:**
```
Employee: Link to employee record
Project: Link to project record
Assignment Date: Date of work
Task Description: Specific task details
Location: Work location
Status: Assigned/In Progress/Completed
Start Time: 8:00 AM (default)
End Time: 5:00 PM (default)
Hours Scheduled: 8 (default)
```

### Step 4.3: Bulk Assignment Creation
1. Create assignments for current week
2. Use patterns from Excel data
3. Ensure no conflicts (employee assigned to multiple projects same day)

## Phase 5: Data Validation

### Step 5.1: Employee Data Validation
- [ ] All employees have unique Employee IDs
- [ ] Names are properly split (First/Last)
- [ ] Phone numbers are formatted correctly
- [ ] Email addresses are valid
- [ ] Positions match Airtable options
- [ ] Hire dates are reasonable
- [ ] Pay rates are within expected ranges

### Step 5.2: Project Data Validation
- [ ] All projects have unique Project IDs
- [ ] Locations are complete addresses
- [ ] Start dates are before end dates
- [ ] Status values match Airtable options
- [ ] Project Manager is set to "Antione Harrell"
- [ ] Budgets are reasonable amounts

### Step 5.3: Assignment Data Validation
- [ ] All assignments link to valid employees
- [ ] All assignments link to valid projects
- [ ] No scheduling conflicts
- [ ] Assignment dates are reasonable
- [ ] Task descriptions are meaningful

## Phase 6: Post-Migration Tasks

### Step 6.1: Data Cleanup
1. Remove any test/sample data
2. Verify all relationships work correctly
3. Check calculated fields and formulas
4. Ensure views display correctly

### Step 6.2: Backup Creation
1. Export all tables to CSV
2. Save backup files to secure location
3. Document backup procedures

### Step 6.3: User Training Data
1. Create training assignments for demonstration
2. Set up sample scenarios for user training
3. Prepare data for testing workflows

## Troubleshooting Common Issues

### Import Errors
- **Duplicate IDs**: Ensure Employee IDs and Project IDs are unique
- **Invalid Dates**: Check date format is MM/DD/YYYY
- **Missing Required Fields**: Verify all required fields have values
- **Invalid Select Options**: Ensure dropdown values match Airtable options

### Data Quality Issues
- **Inconsistent Names**: Standardize name formatting
- **Invalid Phone Numbers**: Use (XXX) XXX-XXXX format
- **Missing Information**: Flag for manual entry
- **Duplicate Records**: Remove or merge duplicates

### Relationship Issues
- **Broken Links**: Ensure linked records exist before creating relationships
- **Missing Connections**: Verify assignment links to both employee and project
- **Circular References**: Avoid self-referencing relationships

## Success Metrics
- [ ] 100% of current employees migrated successfully
- [ ] All active projects represented in system
- [ ] Current week assignments created
- [ ] No data validation errors
- [ ] All relationships working correctly
- [ ] Backup files created and verified
