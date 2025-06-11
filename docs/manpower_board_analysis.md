# MetroPower Manpower Board Analysis

## Current Excel Structure Analysis

The current manpower tracking system uses a complex Excel spreadsheet with the following characteristics:

### General Structure
- **Format**: Multi-header, multi-section Excel spreadsheet
- **Size**: 87 rows × 13 columns
- **Week Identification**: Contains specific week dates (e.g., "Week of: 6/16/25-6/22/25")
- **Layout**: Project-based columns with employee assignments

### Key Data Elements
1. **Employee Information**:
   - Name (often with ID numbers, e.g., "Matt Smith-004478")
   - Position/Trade (Electrician, Field Supervisor (FS), Apprentice, General Laborer (GL), Temp)
   
2. **Project Assignment**:
   - Employees are assigned to different projects/sections in the spreadsheet
   - Multiple projects appear to be tracked simultaneously
   
3. **Status Tracking**:
   - Vacation/Medical leave
   - Military leave
   - PTO (with specific dates)
   - Employment status (e.g., "No Longer with Metro")
   
4. **Resource Allocation**:
   - Available (Unassigned) employees
   - Employees assigned to specific projects
   - PreFab assignments
   
5. **Summary Statistics**:
   - Total employees by category (Red Shirts Working, FS, Electricians, Apprentices, Temps)
   - Counts for each category (e.g., 42 Red Shirts Working, 7 FS, 13 Electricians, etc.)

### Limitations of Current System
1. **Manual Management**: Requires manual updates and tracking
2. **Limited Visualization**: No visual representation of employee distribution
3. **No Real-time Updates**: Cannot track employee movements between sites in real-time
4. **No Notification System**: No automated notifications when employees are reassigned
5. **Limited Search Capability**: Difficult to quickly locate specific employees
6. **No Historical Tracking**: Limited ability to maintain and access historical records
7. **No Export Functionality**: No standardized export for payroll reconciliation
8. **No Integration**: Standalone system not connected to ADP or IFS Arena

## Data Relationships

1. **Employee to Position**: Each employee has a specific trade/position
2. **Employee to Project**: Employees are assigned to specific projects for specific days
3. **Project to Employee Count**: Each project has a certain number of employees assigned
4. **Trade Category to Count**: Summary statistics track the number of employees by trade

## Implicit Workflow
1. **Weekly Planning**: The spreadsheet appears to be updated weekly
2. **Employee Reassignment**: Employees can be moved between projects
3. **Status Tracking**: Employee availability and leave status is manually tracked
4. **Resource Allocation**: Available employees are listed separately for potential assignment

This analysis provides the foundation for designing a more efficient, visual, and automated dashboard system that addresses the current limitations while maintaining the essential data relationships and workflows.
