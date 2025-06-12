/**
 * Dashboard JavaScript
 *
 * Main dashboard functionality for the MetroPower Dashboard
 * with authentication, data loading, and user interactions.
 *
 * Copyright 2025 The HigherSelf Network
 */

// Global variables
let currentWeekStart = null;
let employees = [];
let projects = [];
let assignments = {};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('MetroPower Dashboard initializing...');

    // Initialize components
    initializeHeader();
    initializeLoginModal();
    initializeNotifications();

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

    if (loginButton) {
        loginButton.addEventListener('click', showLoginModal);
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
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

    if (userInfo) userInfo.style.display = 'flex';
    if (loginButton) loginButton.style.display = 'none';

    if (userName && user) {
        userName.textContent = `${user.first_name} ${user.last_name}`;
    }

    if (userRole && user) {
        userRole.textContent = user.role;
    }
}

/**
 * Show unauthenticated state
 */
function showUnauthenticatedState() {
    const userInfo = document.getElementById('userInfo');
    const loginButton = document.getElementById('headerLoginButton');

    if (userInfo) userInfo.style.display = 'none';
    if (loginButton) loginButton.style.display = 'block';

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

        if (response.isDemoMode) {
            showNotification('Logged in successfully (Demo Mode)', 'success');
        } else {
            showNotification('Logged in successfully', 'success');
        }

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

        // Update UI
        updateStatistics(data);
        updateUnassignedEmployees(data.unassignedToday || []);
        updateWeekDisplay();
        updateAssignmentGrid(data.weekAssignments || {});

        if (response.isDemoMode) {
            showNotification('Dashboard loaded (Demo Mode)', 'info');
        }

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
    const container = document.getElementById('unassignedEmployees');
    if (!container) return;

    if (unassignedEmployees.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>All employees are assigned for today</p></div>';
        return;
    }

    const employeeCards = unassignedEmployees.map(employee => `
        <div class="employee-card" data-employee-id="${employee.employee_id}">
            <div class="employee-info">
                <h4>${employee.first_name} ${employee.last_name}</h4>
                <p class="employee-trade">${employee.trade} - ${employee.level}</p>
                <p class="employee-rate">$${employee.hourly_rate}/hr</p>
            </div>
        </div>
    `).join('');

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
