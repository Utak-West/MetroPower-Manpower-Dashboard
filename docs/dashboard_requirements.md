# MetroPower Manpower Dashboard Requirements

## Core Dashboard Requirements

### Primary Function
- Create a visual workforce placement board showing daily employee assignments across all active projects for the current week
- Enable real-time tracking of employee movements between job sites
- Eliminate payroll discrepancies and ensure fair cost allocation

### Key Metrics to Track
1. **Employee Allocation**:
   - Number of employees assigned per project per day
   - Distribution of trades/skills across projects
   - Unassigned/available employees

2. **Project Staffing**:
   - Current staffing levels per project
   - Staffing needs vs. actual allocation
   - Trade/skill distribution within each project

3. **Employee Status**:
   - Current assignment location
   - Trade/skill category
   - Availability status (assigned, unassigned, PTO, etc.)

4. **System Usage**:
   - Assignment changes per day/week
   - Notification deliverability
   - Export frequency and format

### Layout Requirements
- **X-axis**: All active MetroPower projects (displayed as "Project Name - Project Number")
- **Y-axis**: Days of the week (Monday-Friday)
- **Grid Content**: Employee cards showing Name, Employee ID, Trade/Skill
- **Visual Indicators**: Current day highlighted for quick reference
- **Trade Categories**: Color-coded by Electrician, Field Supervisor, Apprentice, General Laborer, Temp

### Core Features
1. **Manual Assignment Interface**:
   - Drag-and-drop employees between projects and days
   - Visual confirmation of assignment changes
   - Prevention or warning for double-booking

2. **Employee Quick Search**:
   - Instant lookup by name or Employee ID
   - Clear indication of current assignment
   - One-click access to employee details

3. **Weekly Archive System**:
   - Save completed weeks with indefinite retention
   - Local download capability
   - Historical view and comparison

4. **Multi-Format Export**:
   - Generate Excel, CSV, and Markdown files
   - Compatibility with ADP and IFS Arena
   - Customizable export templates

5. **Comprehensive Email Notification System**:
   - Automated emails to affected project managers
   - Complete team roster updates
   - Daily summary reports

### Data Management Requirements
- Current week focus with real-time updates
- Manual data entry with visual assignment interface
- Weekly archive with download capability
- Export formats compatible with ADP and IFS Arena systems
- Native backup integration with MetroPower Server

### User Access Requirements
- Primary user: Antoine Harrell (Assistant Project Manager)
- Secondary users: Other project managers
- View-only access for branch managers and HR (optional)

## Success Metrics
1. Eliminate payroll discrepancies between field assignments and ADP/IFS Arena records
2. Ensure fair project cost allocation across all project managers
3. Provide instant employee location lookup for management inquiries
4. Maintain comprehensive audit trail through automated notifications and archives

## Technical Integration Points
- **ADP Integration**: Structure to accommodate future ADP employee roster imports
- **IFS Arena**: Export compatibility for task-based cost allocation
- **MetroPower Server**: Native backup solution integration

## User Experience Requirements
- Align with MetroPower brand guidelines and visual identity
- Modern, clean interface with intuitive navigation
- Mobile-responsive design for field access
- Minimal clicks for common operations
- Clear visual feedback for all actions
