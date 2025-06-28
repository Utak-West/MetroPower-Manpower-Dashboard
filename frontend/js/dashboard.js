/**
 * Dashboard JavaScript
 *
 * Main dashboard functionality for the MetroPower Dashboard
 * with authentication, data loading, and user interactions.
 *
 * Copyright 2025 The HigherSelf Network
 */

console.log('Dashboard.js file loaded');

// Global variables
let currentWeekStart = null;
let employees = [];
let projects = [];
let assignments = {};
let filteredEmployees = [];
let filteredAssignments = {};
let positions = [];

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('MetroPower Dashboard initializing...');

    // Initialize components
    initializeHeader();
    initializeLoginModal();
    initializeNotifications();
    initializeFilters();

    // Check authentication and load data
    await initializeAuthentication();

    // Update current date display
    updateCurrentDate();

    console.log('MetroPower Dashboard initialized');
});

/**
 * Initialize header functionality
 */
function initializeHeader() {
    const loginButton = document.getElementById('headerLoginButton');
    const logoutButton = document.getElementById('logoutButton');
    const manageAssignmentsBtn = document.getElementById('manageAssignmentsBtn');

    if (loginButton) {
        loginButton.addEventListener('click', showLoginModal);
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    if (manageAssignmentsBtn) {
        manageAssignmentsBtn.addEventListener('click', navigateToAssignments);
    }
}

/**
 * Initialize login modal
 */
function initializeLoginModal() {
    const modal = document.getElementById('loginModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    const loginForm = document.getElementById('loginForm');

    if (closeBtn) {
        closeBtn.addEventListener('click', hideLoginModal);
    }

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideLoginModal();
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

/**
 * Initialize filter controls
 */
function initializeFilters() {
    // Add event listeners for filter controls
    const projectFilter = document.getElementById('projectFilter');
    const positionFilter = document.getElementById('positionFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchFilter = document.getElementById('searchFilter');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    if (projectFilter) {
        projectFilter.addEventListener('change', applyDashboardFilters);
    }

    if (positionFilter) {
        positionFilter.addEventListener('change', applyDashboardFilters);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', applyDashboardFilters);
    }

    if (searchFilter) {
        searchFilter.addEventListener('input', applyDashboardFilters);
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearDashboardFilters);
    }
}

/**
 * Initialize authentication state
 */
async function initializeAuthentication() {
    if (api.isAuthenticated()) {
        try {
            const response = await api.verifyToken();
            showAuthenticatedState(response.user);
            await loadDashboardData();
        } catch (error) {
            console.error('Token verification failed:', error);
            showUnauthenticatedState();
        }
    } else {
        showUnauthenticatedState();
    }
}

/**
 * Show authenticated state
 */
function showAuthenticatedState(user) {
    const userInfo = document.getElementById('userInfo');
    const loginButton = document.getElementById('headerLoginButton');
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    const manageAssignmentsBtn = document.getElementById('manageAssignmentsBtn');
    const navAssignmentsTab = document.getElementById('navAssignmentsTab');
    const navStaffTab = document.getElementById('navStaffTab');

    if (userInfo) userInfo.style.display = 'flex';
    if (loginButton) loginButton.style.display = 'none';

    if (userName && user) {
        userName.textContent = `${user.first_name} ${user.last_name}`;
    }

    if (userRole && user) {
        userRole.textContent = user.role;
    }

    // Show manage assignments button for authorized users
    if (manageAssignmentsBtn && user && ['Project Manager', 'Admin', 'Super Admin'].includes(user.role)) {
        manageAssignmentsBtn.style.display = 'inline-block';
    }

    // Show navigation tabs for authenticated users
    const navProjectsTab = document.getElementById('navProjectsTab');
    const navCalendarTab = document.getElementById('navCalendarTab');

    if (navProjectsTab && user && ['Project Manager', 'Admin', 'Super Admin'].includes(user.role)) {
        navProjectsTab.style.display = 'inline-block';
    }

    if (navCalendarTab && user && ['Project Manager', 'Admin', 'Super Admin'].includes(user.role)) {
        navCalendarTab.style.display = 'inline-block';
    }

    if (navAssignmentsTab && user && ['Project Manager', 'Admin', 'Super Admin'].includes(user.role)) {
        navAssignmentsTab.style.display = 'inline-block';
    }

    if (navStaffTab && user && ['Project Manager', 'Admin', 'Super Admin'].includes(user.role)) {
        navStaffTab.style.display = 'inline-block';
    }
}

/**
 * Show unauthenticated state
 */
function showUnauthenticatedState() {
    const userInfo = document.getElementById('userInfo');
    const loginButton = document.getElementById('headerLoginButton');
    const manageAssignmentsBtn = document.getElementById('manageAssignmentsBtn');
    const navAssignmentsTab = document.getElementById('navAssignmentsTab');
    const navStaffTab = document.getElementById('navStaffTab');

    if (userInfo) userInfo.style.display = 'none';
    if (loginButton) loginButton.style.display = 'block';
    if (manageAssignmentsBtn) manageAssignmentsBtn.style.display = 'none';

    // Hide navigation tabs for unauthenticated users
    if (navAssignmentsTab) navAssignmentsTab.style.display = 'none';
    if (navStaffTab) navStaffTab.style.display = 'none';

    showLoginModal();
}

/**
 * Show login modal
 */
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';

        // Focus on identifier field
        const identifierField = document.getElementById('identifier');
        if (identifierField) {
            setTimeout(() => identifierField.focus(), 100);
        }
    }
}

/**
 * Hide login modal
 */
function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Handle login form submission
 */
async function handleLogin(event) {
    event.preventDefault();

    const identifier = document.getElementById('identifier').value;
    const password = document.getElementById('password').value;

    if (!identifier || !password) {
        showNotification('Please enter both username/email and password', 'error');
        return;
    }

    try {
        showLoading(true);
        const response = await api.login(identifier, password);

        showAuthenticatedState(response.user);
        hideLoginModal();
        showNotification('Logged in successfully', 'success');
        await loadDashboardData();

    } catch (error) {
        console.error('Login error:', error);
        showNotification(`Login failed: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Handle logout
 */
async function handleLogout() {
    try {
        await api.logout();
        showUnauthenticatedState();
        clearDashboardData();
        showNotification('Logged out successfully', 'info');
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed', 'error');
    }
}

/**
 * Navigate to assignment management page
 */
function navigateToAssignments() {
    window.location.href = '/assignments.html';
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    try {
        showLoading(true);

        const response = await api.getDashboardData();
        const data = response.data;

        // Update global variables
        currentWeekStart = data.weekStart;
        employees = data.unassignedToday || [];
        projects = data.activeProjects || [];
        assignments = data.weekAssignments || {};

        // Initialize filtered data
        filteredEmployees = [...employees];
        filteredAssignments = {...assignments};

        // Load positions for filtering
        await loadPositions();

        // Populate filter dropdowns
        populateFilterDropdowns();

        // Update UI
        updateStatistics(data);
        updateUnassignedEmployees(filteredEmployees);
        updateWeekDisplay();
        updateAssignmentGrid(filteredAssignments);

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification(`Failed to load dashboard data: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Update statistics display
 */
function updateStatistics(data) {
    const stats = data.employeeStatistics || {};
    const projectStats = data.projectStatistics || {};

    updateElement('totalEmployees', stats.total || 0);
    updateElement('activeProjects', projectStats.active || 0);
    updateElement('todayAssignments', stats.assigned || 0);
    updateElement('unassignedCount', stats.unassigned || 0);
}

/**
 * Update unassigned employees display
 */
function updateUnassignedEmployees(unassignedEmployees) {
    console.log('updateUnassignedEmployees called with', unassignedEmployees.length, 'employees');
    const container = document.getElementById('unassignedEmployees');
    if (!container) return;

    if (unassignedEmployees.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>All employees are assigned for today</p></div>';
        return;
    }

    const employeeCards = unassignedEmployees.map(employee => {
        // Handle different name field structures
        const employeeName = employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim();

        // Handle different position field names
        const employeePosition = employee.position || employee.position_name || employee.trade || 'Not specified';

        // Handle hourly rate (may not be available in demo data)
        const hourlyRate = employee.hourly_rate || employee.rate || 'N/A';
        const rateDisplay = hourlyRate !== 'N/A' ? `$${hourlyRate}/hr` : 'Rate not specified';

        return `
            <div class="employee-card" data-employee-id="${employee.employee_id}">
                <div class="employee-info">
                    <h4>${employeeName}</h4>
                    <p class="employee-trade">${employeePosition}</p>
                    <p class="employee-rate">${rateDisplay}</p>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = employeeCards;
}

/**
 * Update week display
 */
function updateWeekDisplay() {
    const weekElement = document.getElementById('currentWeek');
    if (weekElement && currentWeekStart) {
        const startDate = new Date(currentWeekStart);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        };

        weekElement.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
}

/**
 * Update assignment grid
 */
function updateAssignmentGrid(weekAssignments) {
    const container = document.getElementById('assignmentGrid');
    if (!container) return;

    // For now, show a simple message
    container.innerHTML = '<div class="empty-state"><p>Assignment grid functionality coming soon</p></div>';
}

/**
 * Update current date display
 */
function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

/**
 * Clear dashboard data
 */
function clearDashboardData() {
    currentWeekStart = null;
    employees = [];
    projects = [];
    assignments = {};

    // Clear UI
    updateElement('totalEmployees', 0);
    updateElement('activeProjects', 0);
    updateElement('todayAssignments', 0);
    updateElement('unassignedCount', 0);

    const unassignedContainer = document.getElementById('unassignedEmployees');
    if (unassignedContainer) {
        unassignedContainer.innerHTML = '<div class="empty-state"><p>Please log in to view data</p></div>';
    }

    const gridContainer = document.getElementById('assignmentGrid');
    if (gridContainer) {
        gridContainer.innerHTML = '<div class="empty-state"><p>Please log in to view assignments</p></div>';
    }
}

/**
 * Utility function to update element text content
 */
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

/**
 * Load positions for filtering
 */
async function loadPositions() {
    try {
        const response = await api.get('/positions');
        positions = response.data || [];
    } catch (error) {
        console.error('Error loading positions:', error);
        positions = [];
    }
}

/**
 * Populate filter dropdowns
 */
function populateFilterDropdowns() {
    // Populate project filter
    const projectFilter = document.getElementById('projectFilter');
    if (projectFilter) {
        projectFilter.innerHTML = '<option value="">All Projects</option>';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.project_id;
            option.textContent = project.name || project.project_name;
            projectFilter.appendChild(option);
        });
    }

    // Populate position filter
    const positionFilter = document.getElementById('positionFilter');
    if (positionFilter) {
        positionFilter.innerHTML = '<option value="">All Positions</option>';
        positions.forEach(position => {
            const option = document.createElement('option');
            option.value = position.name;
            option.textContent = position.name;
            positionFilter.appendChild(option);
        });
    }
}

/**
 * Apply dashboard filters
 */
function applyDashboardFilters() {
    console.log('applyDashboardFilters called');
    const projectFilter = document.getElementById('projectFilter')?.value || '';
    const positionFilter = document.getElementById('positionFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const searchFilter = document.getElementById('searchFilter')?.value.toLowerCase() || '';
    console.log('Search filter value:', searchFilter);

    // Filter employees with all criteria
    console.log('Starting employee filtering...');
    try {
        filteredEmployees = employees.filter(employee => {
            // Position filter
            if (positionFilter) {
                const employeePosition = employee.position || employee.position_name || '';
                if (employeePosition !== positionFilter) {
                    return false;
                }
            }

            // Status filter
            if (statusFilter) {
                let employeeStatus = employee.status;
                // Convert boolean is_active to status string if needed
                if (typeof employee.is_active === 'boolean') {
                    employeeStatus = employee.is_active ? 'Active' : 'Inactive';
                }
                // Default to Active if no status specified
                employeeStatus = employeeStatus || 'Active';

                if (employeeStatus !== statusFilter) {
                    return false;
                }
            }

            // Search filter - search in name, employee ID, and employee number
            if (searchFilter) {
                const employeeName = employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
                const searchFields = [
                    employeeName,
                    employee.employee_id?.toString() || '',
                    employee.employee_number?.toString() || ''
                ].join(' ').toLowerCase();

                if (!searchFields.includes(searchFilter)) {
                    return false;
                }
            }

            return true;
        });
        console.log('Employee filtering completed. Filtered count:', filteredEmployees.length);
    } catch (error) {
        console.error('Error in employee filtering:', error);
        filteredEmployees = [...employees];
    }

    // Filter assignments by project
    console.log('Starting assignment filtering...');
    try {
        filteredAssignments = {};
        Object.keys(assignments).forEach(date => {
            // Ensure assignments[date] is an array before filtering
            if (Array.isArray(assignments[date])) {
                filteredAssignments[date] = assignments[date].filter(assignment => {
                    if (projectFilter && assignment.project_id != projectFilter) {
                        return false;
                    }
                    return true;
                });
            } else {
                filteredAssignments[date] = assignments[date] || [];
            }
        });
        console.log('Assignment filtering completed');
    } catch (error) {
        console.error('Error in assignment filtering:', error);
        filteredAssignments = {...assignments};
    }

    // Update displays
    console.log('Updating displays...');
    updateUnassignedEmployees(filteredEmployees);
    updateFilteredStatistics();
    console.log('Filter function completed');
}

/**
 * Clear dashboard filters
 */
function clearDashboardFilters() {
    document.getElementById('projectFilter').value = '';
    document.getElementById('positionFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('searchFilter').value = '';
    document.getElementById('sortBy').value = 'name';
    document.getElementById('sortOrder').value = 'asc';

    filteredEmployees = [...employees];
    filteredAssignments = {...assignments};

    applySorting();
    updateUnassignedEmployees(filteredEmployees);
    updateAssignmentGrid(filteredAssignments);
    updateFilteredStatistics();
}

/**
 * Apply sorting to filtered data
 */
function applySorting() {
    const sortBy = document.getElementById('sortBy')?.value || 'name';
    const sortOrder = document.getElementById('sortOrder')?.value || 'asc';

    // Sort employees
    filteredEmployees.sort((a, b) => {
        let aValue, bValue;

        switch (sortBy) {
            case 'name':
                aValue = a.name || `${a.first_name || ''} ${a.last_name || ''}`.trim();
                bValue = b.name || `${b.first_name || ''} ${b.last_name || ''}`.trim();
                break;
            case 'position':
                aValue = a.position || a.position_name || a.trade || '';
                bValue = b.position || b.position_name || b.trade || '';
                break;
            case 'status':
                // Handle different status representations
                aValue = a.status || (typeof a.is_active === 'boolean' ? (a.is_active ? 'Active' : 'Inactive') : 'Active');
                bValue = b.status || (typeof b.is_active === 'boolean' ? (b.is_active ? 'Active' : 'Inactive') : 'Active');
                break;
            case 'employee_number':
                aValue = a.employee_number || a.employee_id || '';
                bValue = b.employee_number || b.employee_id || '';
                break;
            default:
                aValue = a.name || `${a.first_name || ''} ${a.last_name || ''}`.trim();
                bValue = b.name || `${b.first_name || ''} ${b.last_name || ''}`.trim();
        }

        // Convert to strings for comparison
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();

        if (sortOrder === 'desc') {
            return bValue.localeCompare(aValue);
        } else {
            return aValue.localeCompare(bValue);
        }
    });

    // Note: Display updates are handled by the calling function
    // updateUnassignedEmployees(filteredEmployees); // Removed to avoid duplicate calls
    // updateFilteredStatistics(); // Removed to avoid duplicate calls
}

/**
 * Update statistics based on filtered data
 */
function updateFilteredStatistics() {
    // Update the "Unassigned Today" count to reflect filtered employees
    const unassignedCountEl = document.getElementById('unassignedCount');
    if (unassignedCountEl) {
        unassignedCountEl.textContent = filteredEmployees.length;
    }
}

/**
 * Export dashboard data
 */
async function exportDashboard(format) {
    try {
        // Prepare dashboard summary data for export
        const dashboardData = {
            summary: {
                total_employees: employees.length,
                unassigned_employees: filteredEmployees.length,
                total_projects: projects.length,
                week_start: currentWeekStart
            },
            unassigned_employees: filteredEmployees,
            weekly_assignments: filteredAssignments
        };

        // For now, export the assignments data
        const response = await fetch(`${api.baseURL}/exports/assignments?format=${format}`, {
            headers: api.getHeaders()
        });

        if (!response.ok) {
            throw new Error('Export failed');
        }

        if (format === 'excel' || format === 'pdf') {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            let fileExtension = format;
            if (format === 'excel') fileExtension = 'xlsx';

            a.download = `dashboard_summary_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showNotification(`Dashboard exported as ${format.toUpperCase()} successfully!`, 'success');
        } else {
            const data = await response.json();
            console.log('Export data:', data);
            showNotification('Export completed!', 'success');
        }
    } catch (error) {
        console.error('Export failed:', error);
        showNotification('Export failed: ' + error.message, 'error');
    }
}
