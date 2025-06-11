# MetroPower Manpower Dashboard - Layout Concepts

## Main Dashboard Layout

### Header Section
- **Logo & Branding**: MetroPower logo and branding elements in top left
- **Week Navigation**: Current week display with forward/backward controls
- **Quick Actions**: New assignment, export, and settings buttons
- **Search Bar**: Prominent employee search functionality
- **User Info**: Current user and role information

### Main Grid View
- **X-Axis**: Project columns labeled as "Project Name - Project Number"
- **Y-Axis**: Days of the week (Monday-Friday)
- **Current Day**: Highlighted row for the current day
- **Grid Cells**: Containers for employee cards assigned to specific project/day
- **Employee Cards**: Color-coded by trade with name, ID, and position displayed

### Sidebar Elements
- **Unassigned Pool**: Section for available/unassigned employees
- **Filters Panel**: Quick filters for trades, projects, and status
- **Summary Statistics**: Count of employees by trade and assignment status
- **Notifications Center**: Recent changes and alerts

### Footer Elements
- **Export Controls**: Buttons for different export formats
- **Status Indicators**: Data sync status and last update timestamp
- **Help & Support**: Quick access to documentation and support

## Employee Card Design
- **Color Bar**: Trade-specific color coding (Electrician, FS, Apprentice, GL, Temp)
- **Employee Name**: Primary text in bold
- **Employee ID**: Secondary text in regular weight
- **Position/Trade**: Tertiary text or icon indicator
- **Status Indicator**: Visual cue for special statuses (PTO, Leave, etc.)
- **Action Menu**: Contextual menu for card-specific actions

## Interaction Patterns

### Drag and Drop Assignment
1. User selects employee card (visual highlight on selection)
2. User drags card to target project/day cell
3. Visual feedback during drag operation (ghost card or highlight)
4. Drop zone highlights when valid target is hovered
5. Warning appears if attempting to assign to already occupied position
6. Card snaps into position when dropped
7. Notification appears confirming the change

### Search and Filter Flow
1. User enters text in search field
2. Results filter in real-time as user types
3. Matching employees are highlighted on the board
4. Non-matching employees are dimmed
5. Quick-action buttons appear next to search results
6. User can click result to auto-scroll to employee's location

### Weekly Navigation Flow
1. User clicks forward/backward week controls
2. Loading indicator appears during data retrieval
3. Grid smoothly transitions to show new week data
4. Week indicator updates to show current view
5. Archive indicator appears when viewing past weeks
6. "Return to Current Week" button appears when viewing non-current weeks

### Export Workflow
1. User clicks export button
2. Modal appears with export options (format, scope, customization)
3. Preview of export data is shown
4. User confirms export settings
5. Progress indicator during export generation
6. Download starts automatically or link is provided
7. Confirmation of successful export

## Responsive Adaptations

### Tablet View
- Condensed header with expandable sections
- Swipeable grid for horizontal navigation between projects
- Touch-optimized employee cards and controls
- Bottom navigation bar for key functions

### Mobile View
- Single project view with dropdown project selector
- Day tabs for switching between weekdays
- Full-width employee cards with expanded details
- Floating action button for key operations
