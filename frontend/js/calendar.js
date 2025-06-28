/**
 * Calendar View JavaScript
 *
 * Handles the calendar view functionality for the MetroPower Dashboard
 *
 * Copyright 2025 The HigherSelf Network
 */

console.log('Calendar.js file loaded');

// Global variables
let currentDate = new Date();
let currentView = 'month';
let calendarData = {};

// Initialize calendar page when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Calendar page initializing...');

    // Initialize components
    initializeAuth();
    initializeCalendarControls();
    initializeDate();

    // Check authentication and load data
    await checkAuthentication();

    // Check for project filter in URL
    initializeProjectFilter();

    console.log('Calendar page initialized');
});

/**
 * Initialize date display
 */
function initializeDate() {
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        currentDateElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

/**
 * Initialize project filter from URL parameters
 */
function initializeProjectFilter() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project');

    if (projectId) {
        // Show notification about project filter
        showNotification(`Filtering calendar for project: ${projectId}`, 'info');

        // Apply project filter to calendar view
        // This would integrate with the existing calendar filtering logic
        console.log(`Calendar filtered for project: ${projectId}`);

        // You could add visual indicators here, like highlighting the project
        // or adding a filter badge to the calendar header
    }
}

/**
 * Initialize calendar controls
 */
function initializeCalendarControls() {
    const monthViewBtn = document.getElementById('monthViewBtn');
    const weekViewBtn = document.getElementById('weekViewBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const todayBtn = document.getElementById('todayBtn');

    if (monthViewBtn) {
        monthViewBtn.addEventListener('click', () => switchView('month'));
    }

    if (weekViewBtn) {
        weekViewBtn.addEventListener('click', () => switchView('week'));
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => navigateCalendar(-1));
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => navigateCalendar(1));
    }

    if (todayBtn) {
        todayBtn.addEventListener('click', () => goToToday());
    }
}

/**
 * Switch between month and week view
 */
function switchView(view) {
    currentView = view;
    
    const monthViewBtn = document.getElementById('monthViewBtn');
    const weekViewBtn = document.getElementById('weekViewBtn');
    const monthView = document.getElementById('monthView');
    const weekView = document.getElementById('weekView');

    // Update button states
    if (monthViewBtn && weekViewBtn) {
        monthViewBtn.classList.toggle('active', view === 'month');
        weekViewBtn.classList.toggle('active', view === 'week');
    }

    // Show/hide views
    if (monthView && weekView) {
        monthView.style.display = view === 'month' ? 'block' : 'none';
        weekView.style.display = view === 'week' ? 'block' : 'none';
    }

    // Load data for the current view
    loadCalendar();
}

/**
 * Navigate calendar (previous/next)
 */
function navigateCalendar(direction) {
    if (currentView === 'month') {
        currentDate.setMonth(currentDate.getMonth() + direction);
    } else {
        currentDate.setDate(currentDate.getDate() + (direction * 7));
    }
    
    loadCalendar();
}

/**
 * Go to today
 */
function goToToday() {
    currentDate = new Date();
    loadCalendar();
}

/**
 * Check authentication and load calendar
 */
async function checkAuthentication() {
    try {
        const user = await getCurrentUser();
        
        if (!user) {
            window.location.href = '/index.html';
            return;
        }

        // Update user display
        updateElement('userDisplay', `${user.first_name} ${user.last_name} (${user.role})`);

        // Load calendar data
        await loadCalendar();

    } catch (error) {
        console.error('Authentication check failed:', error);
        window.location.href = '/index.html';
    }
}

/**
 * Load calendar data
 */
async function loadCalendar() {
    try {
        showLoadingState();

        if (currentView === 'month') {
            await loadMonthView();
        } else {
            await loadWeekView();
        }

        hideLoadingState();

    } catch (error) {
        console.error('Error loading calendar:', error);
        hideLoadingState();
        showErrorState();
    }
}

/**
 * Load month view data
 */
async function loadMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const response = await api.getCalendarMonth(year, month);
    calendarData = response.data;

    // Update period display
    updateElement('currentPeriod', `${getMonthName(month - 1)} ${year}`);

    // Render month calendar
    renderMonthCalendar();
}

/**
 * Load week view data
 */
async function loadWeekView() {
    const dateStr = currentDate.toISOString().split('T')[0];

    const response = await api.getCalendarWeek(dateStr);
    const rawData = response.data;

    // Normalize week data structure to match month view format
    const normalizedAssignments = {};
    if (rawData.assignments && Array.isArray(rawData.assignments)) {
        rawData.assignments.forEach(dayData => {
            normalizedAssignments[dayData.date] = dayData.assignments || [];
        });
    }

    calendarData = {
        weekStart: rawData.weekStart,
        weekEnd: rawData.weekEnd,
        assignments: normalizedAssignments
    };

    // Update period display
    const weekStart = new Date(calendarData.weekStart);
    const weekEnd = new Date(calendarData.weekEnd);
    updateElement('currentPeriod', `${formatDate(weekStart)} - ${formatDate(weekEnd)}`);

    // Render week calendar
    renderWeekCalendar();
}

/**
 * Render month calendar
 */
function renderMonthCalendar() {
    const monthCalendar = document.getElementById('monthCalendar');
    if (!monthCalendar) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and calculate calendar grid
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1));

    const today = new Date();
    const weeks = [];
    let currentWeek = [];

    // Generate 6 weeks of calendar
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        currentWeek.push(date);
        
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }

    // Render calendar weeks
    const weeksHTML = weeks.map(week => {
        const daysHTML = week.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            const dayAssignments = calendarData.assignments[dateStr] || [];
            const isToday = date.toDateString() === today.toDateString();
            const isCurrentMonth = date.getMonth() === month;
            
            const dayNumberClass = `day-number ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`;
            
            const assignmentsHTML = dayAssignments.slice(0, 3).map(assignment =>
                `<div class="assignment-item" onclick="showAssignmentDetails('${dateStr}')">${assignment.employee ? assignment.employee.name : 'Unknown'}</div>`
            ).join('');
            
            const moreCount = dayAssignments.length > 3 ? dayAssignments.length - 3 : 0;
            const countHTML = moreCount > 0 ? `<div class="assignment-count">${moreCount}+</div>` : '';

            return `
                <div class="calendar-day" onclick="handleCalendarCellClick(event, '${dateStr}')" oncontextmenu="handleCalendarCellClick(event, '${dateStr}')">
                    <div class="${dayNumberClass}">${date.getDate()}</div>
                    ${assignmentsHTML}
                    ${countHTML}
                </div>
            `;
        }).join('');

        return `<div class="calendar-week">${daysHTML}</div>`;
    }).join('');

    monthCalendar.innerHTML = weeksHTML;
}

/**
 * Render week calendar
 */
function renderWeekCalendar() {
    const weekGrid = document.getElementById('weekGrid');
    if (!weekGrid) return;

    const weekStart = new Date(calendarData.weekStart);
    const days = [];

    // Generate 7 days of the week
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        days.push(date);
    }

    // Create week grid with proper structure
    const weekHTML = `
        <div class="week-header">
            ${days.map(date => `
                <div class="week-day-header">
                    <div class="day-name">${getDayName(date.getDay())}</div>
                    <div class="day-number">${date.getDate()}</div>
                </div>
            `).join('')}
        </div>
        <div class="week-content">
            ${days.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                const dayAssignments = calendarData.assignments[dateStr] || [];

                const assignmentsContent = dayAssignments.map(assignment =>
                    `<div class="assignment-item" onclick="showAssignmentDetails('${dateStr}')">
                        <div class="assignment-employee">${assignment.employee ? assignment.employee.name : 'Unknown'}</div>
                        <div class="assignment-project">${assignment.project ? assignment.project.name : 'Unknown Project'}</div>
                    </div>`
                ).join('');

                return `<div class="week-day-column">${assignmentsContent}</div>`;
            }).join('')}
        </div>
    `;

    weekGrid.innerHTML = weekHTML;
}

/**
 * Show loading state
 */
function showLoadingState() {
    const loadingState = document.getElementById('loadingState');
    const monthView = document.getElementById('monthView');
    const weekView = document.getElementById('weekView');
    const errorState = document.getElementById('errorState');

    if (loadingState) loadingState.style.display = 'block';
    if (monthView) monthView.style.display = 'none';
    if (weekView) weekView.classList.remove('active');
    if (errorState) errorState.style.display = 'none';
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) loadingState.style.display = 'none';

    // Show the appropriate view
    const monthView = document.getElementById('monthView');
    const weekView = document.getElementById('weekView');

    if (currentView === 'month') {
        if (monthView) monthView.style.display = 'block';
        if (weekView) weekView.style.display = 'none';
    } else {
        if (monthView) monthView.style.display = 'none';
        if (weekView) weekView.style.display = 'block';
    }
}

/**
 * Show error state
 */
function showErrorState() {
    const errorState = document.getElementById('errorState');
    const monthView = document.getElementById('monthView');
    const weekView = document.getElementById('weekView');

    if (errorState) errorState.style.display = 'block';
    if (monthView) monthView.style.display = 'none';
    if (weekView) weekView.classList.remove('active');
}

/**
 * Show assignment details for a specific date
 */
function showAssignmentDetails(dateStr) {
    const assignments = calendarData.assignments[dateStr] || [];
    
    if (assignments.length === 0) {
        showNotification('No assignments for this date', 'info');
        return;
    }

    // Update modal content
    updateElement('modalDate', `Assignments for ${formatDate(new Date(dateStr))}`);
    
    const assignmentsHTML = assignments.map(assignment => `
        <div class="assignment-detail">
            <strong>${assignment.employee.name}</strong> - ${assignment.project.name}
            <br><small>Position: ${assignment.employee.position || 'N/A'}</small>
        </div>
    `).join('');

    updateElement('modalAssignmentContent', assignmentsHTML);

    // Show modal
    const modal = document.getElementById('assignmentModal');
    if (modal) modal.style.display = 'flex';
}

/**
 * Show day details (same as assignment details for now)
 */
function showDayDetails(dateStr) {
    showAssignmentDetails(dateStr);
}

/**
 * Check for conflicts on a specific date
 */
async function checkConflicts(dateStr) {
    try {
        const response = await api.getCalendarConflicts(dateStr);
        const conflicts = response.data.conflicts;

        if (conflicts.length > 0) {
            showNotification(`${conflicts.length} scheduling conflicts found on ${formatDate(new Date(dateStr))}`, 'warning');
            return conflicts;
        } else {
            showNotification('No conflicts found', 'success');
            return [];
        }
    } catch (error) {
        console.error('Error checking conflicts:', error);
        showNotification('Failed to check conflicts', 'error');
        return [];
    }
}

/**
 * Quick assignment creation (placeholder)
 */
function quickCreateAssignment(dateStr) {
    showNotification('Quick assignment creation coming soon', 'info');
    // This would open a modal for quick assignment creation
}

/**
 * Handle calendar cell click for potential drag-and-drop
 */
function handleCalendarCellClick(event, dateStr) {
    event.preventDefault();

    // Check if this is a right-click for context menu
    if (event.button === 2) {
        showContextMenu(event, dateStr);
        return;
    }

    // Regular click - show day details
    showDayDetails(dateStr);
}

/**
 * Show context menu for calendar actions
 */
function showContextMenu(event, dateStr) {
    // Prevent default context menu
    event.preventDefault();

    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = event.clientX + 'px';
    contextMenu.style.top = event.clientY + 'px';
    contextMenu.style.background = 'white';
    contextMenu.style.border = '1px solid #ccc';
    contextMenu.style.borderRadius = '4px';
    contextMenu.style.padding = '8px 0';
    contextMenu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    contextMenu.style.zIndex = '1001';

    contextMenu.innerHTML = `
        <div class="context-menu-item" onclick="quickCreateAssignment('${dateStr}')">Create Assignment</div>
        <div class="context-menu-item" onclick="checkConflicts('${dateStr}')">Check Conflicts</div>
        <div class="context-menu-item" onclick="showDayDetails('${dateStr}')">View Details</div>
    `;

    // Add styles for menu items
    const style = document.createElement('style');
    style.textContent = `
        .context-menu-item {
            padding: 8px 16px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .context-menu-item:hover {
            background: #f8f9fa;
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(contextMenu);

    // Remove menu when clicking elsewhere
    const removeMenu = () => {
        if (contextMenu.parentNode) {
            contextMenu.parentNode.removeChild(contextMenu);
        }
        document.removeEventListener('click', removeMenu);
    };

    setTimeout(() => {
        document.addEventListener('click', removeMenu);
    }, 100);
}

/**
 * Close assignment modal
 */
function closeAssignmentModal() {
    const modal = document.getElementById('assignmentModal');
    if (modal) modal.style.display = 'none';
}

/**
 * Export calendar data
 */
async function exportCalendar() {
    try {
        showNotification('Exporting calendar...', 'info');
        
        // This would integrate with the existing export functionality
        // For now, show a placeholder message
        showNotification('Calendar export functionality coming soon', 'info');
        
    } catch (error) {
        console.error('Error exporting calendar:', error);
        showNotification('Failed to export calendar', 'error');
    }
}

/**
 * Get month name
 */
function getMonthName(monthIndex) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
}

/**
 * Get day name
 */
function getDayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
}

/**
 * Get day name
 */
function getDayName(dayIndex) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
}
