/**
 * MetroPower Manpower Dashboard - Frontend JavaScript
 *
 * This file contains all the interactive functionality for the dashboard,
 * including drag-and-drop assignment management, real-time updates, and
 * backend API integration.
 */

// Global variables
let currentWeekStart = null;
let employees = [];
let projects = [];
let assignments = {};
let draggedEmployee = null;
let authToken = null;
let socket = null;


// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' ?
    'http://localhost:3001/api' : '/api';

// Authentication and API utilities
class APIClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('authToken');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);

            if (response.status === 401) {
                this.handleAuthError();
                throw new Error('Authentication required');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint);
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    setToken(token) {
        this.token = token;
        authToken = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    handleAuthError() {
        this.setToken(null);
        showLoginModal();
    }
}

const api = new APIClient();

// Header Authentication Management
function initHeaderAuthentication() {
    // Initialize login button click handler
    const headerLoginButton = document.getElementById('headerLoginButton');
    if (headerLoginButton) {
        headerLoginButton.addEventListener('click', showLoginModal);
    }

    // Initialize logout button click handler
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // Set initial authentication state
    updateHeaderAuthenticationState();
}

function updateHeaderAuthenticationState() {
    const loginContainer = document.getElementById('loginButtonContainer');
    const userContainer = document.getElementById('userInfoContainer');

    if (api.token) {
        // User is authenticated - show user info, hide login button
        if (loginContainer) loginContainer.classList.add('hidden');
        if (userContainer) userContainer.classList.remove('hidden');
    } else {
        // User is not authenticated - show login button, hide user info
        if (loginContainer) loginContainer.classList.remove('hidden');
        if (userContainer) userContainer.classList.add('hidden');
    }
}

function showUnauthenticatedState() {
    updateHeaderAuthenticationState();
    showLoginModal();
}

function showAuthenticatedState(userData) {
    // Update user info in header
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');

    if (userName && userData.first_name && userData.last_name) {
        userName.textContent = `${userData.first_name} ${userData.last_name}`;
    }

    if (userRole && userData.role) {
        userRole.textContent = userData.role;
    }

    updateHeaderAuthenticationState();
}

function handleLogout() {
    // Clear authentication
    api.setToken(null);

    // Update header state
    updateHeaderAuthenticationState();

    // Show login modal
    showLoginModal();

    // Clear dashboard data
    clearDashboardData();

    showNotification('Logged out successfully', 'info');
}

function clearDashboardData() {
    // Clear global variables
    currentWeekStart = null;
    employees = [];
    projects = [];
    assignments = {};

    // Clear UI elements
    const unassignedPool = document.querySelector('.unassigned-pool');
    if (unassignedPool) {
        unassignedPool.innerHTML = '<p>Please log in to view employees</p>';
    }

    const mainGrid = document.querySelector('.main-grid tbody');
    if (mainGrid) {
        mainGrid.innerHTML = '<tr><td colspan="5">Please log in to view assignments</td></tr>';
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize header authentication state
    initHeaderAuthentication();

    // Check authentication
    if (!api.token) {
        showUnauthenticatedState();
        return;
    }

    // Initialize components
    initDashboard();
    initDragAndDrop();
    initSearch();
    initWeekNavigation();
    initExport();
    initWebSocket();

    // Load initial data
    loadDashboardData();
});

// Authentication Modal
function showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'login-modal';



    modal.innerHTML = `
        <div class="login-form">
            <h2>MetroPower Dashboard Login</h2>
            <form id="loginForm">
                <div class="form-group">
                    <label for="identifier">Email or Username:</label>
                    <input type="text" id="identifier" required>
                </div>
                <div class="form-group">
                    <label for="password">Password:</label>
                    <input type="password" id="password" required>
                </div>
                <button type="submit">Login</button>
                <div class="login-error" style="display: none;"></div>
            </form>

            <div class="login-credentials">
                <p><strong>Default Login Credentials:</strong></p>
                <p>Email: admin@metropower.com</p>
                <p>Password: MetroPower2025!</p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Regular login form handler
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;
        const errorElement = document.querySelector('.login-error');

        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;

        try {
            const response = await api.post('/auth/login', { identifier, password });
            api.setToken(response.accessToken);

            // Update header with user info
            showAuthenticatedState(response.user);

            modal.remove();
            initDashboard();
            loadDashboardData();
        } catch (error) {
            console.error('Login error:', error);

            // Provide helpful error messages
            let errorMessage = error.message;
            if (error.message.includes('HTTP 500')) {
                errorMessage = 'Server error. Please check the debug endpoint at /api/debug for more information.';
            } else if (error.message.includes('Authentication failed')) {
                errorMessage = 'Invalid email/username or password. Try: admin@metropower.com / MetroPower2025!';
            } else if (error.message.includes('fetch')) {
                errorMessage = 'Cannot connect to server. Please check your internet connection.';
            }

            errorElement.textContent = errorMessage;
            errorElement.style.display = 'block';
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });


}







// Dashboard initialization
async function initDashboard() {
    try {
        // Verify token is still valid
        const response = await api.get('/auth/verify');
        console.log('Authentication verified');

        // Update header with verified user info
        if (response.user) {
            showAuthenticatedState(response.user);
        }
    } catch (error) {
        console.log('Authentication verification failed:', error);
        showUnauthenticatedState();
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        showLoading(true);
        const data = await api.get('/dashboard/current');

        currentWeekStart = data.data.weekStart;
        employees = data.data.unassignedToday || [];
        projects = data.data.activeProjects || [];
        assignments = data.data.weekAssignments || {};

        renderDashboard(data.data);
        updateWeekDisplay();

    } catch (error) {
        showNotification('Error loading dashboard data: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Render dashboard with data
function renderDashboard(data) {
    renderUnassignedEmployees(data.unassignedToday || []);
    renderWeekGrid(data.weekAssignments || {});
    renderStatistics(data.employeeStatistics || {});
}

// Render unassigned employees
function renderUnassignedEmployees(unassignedEmployees) {
    const container = document.querySelector('.unassigned-employees');
    if (!container) return;

    container.innerHTML = '';

    unassignedEmployees.forEach(employee => {
        const card = document.createElement('div');
        card.className = 'employee-card';
        card.id = `employee-${employee.employee_id}`;
        card.setAttribute('data-employee-id', employee.employee_id);
        card.setAttribute('draggable', 'true');
        card.style.borderLeft = `4px solid ${employee.position_color}`;

        card.innerHTML = `
            <div class="employee-name">${employee.name}</div>
            <div class="employee-id">${employee.employee_id}</div>
            <div class="employee-position">${employee.position_name}</div>
        `;

        container.appendChild(card);
    });

    // Re-initialize drag and drop for new cards
    initDragAndDrop();
}

// Drag and Drop Functionality
function initDragAndDrop() {
    const employeeCards = document.querySelectorAll('.employee-card');
    const gridCells = document.querySelectorAll('.grid-cell');

    employeeCards.forEach(card => {
        card.setAttribute('draggable', true);

        card.addEventListener('dragstart', function(e) {
            draggedEmployee = {
                id: this.getAttribute('data-employee-id'),
                element: this,
                fromProject: this.closest('.grid-cell')?.getAttribute('data-project') || null
            };
            e.dataTransfer.setData('text/plain', this.id);
            setTimeout(() => {
                this.classList.add('dragging');
            }, 0);
        });

        card.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            draggedEmployee = null;
        });
    });

    gridCells.forEach(cell => {
        cell.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drop-hover');
        });

        cell.addEventListener('dragleave', function() {
            this.classList.remove('drop-hover');
        });

        cell.addEventListener('drop', async function(e) {
            e.preventDefault();
            this.classList.remove('drop-hover');

            if (!draggedEmployee) return;

            const toProject = this.getAttribute('data-project');
            const day = this.getAttribute('data-day');
            const assignmentDate = getDateForDay(day);

            try {
                await moveEmployee(
                    draggedEmployee.id,
                    draggedEmployee.fromProject,
                    toProject,
                    assignmentDate
                );

                // Move the visual element
                this.appendChild(draggedEmployee.element);
                showNotification(`Employee reassigned to ${toProject}`, 'success');

            } catch (error) {
                showNotification('Error moving employee: ' + error.message, 'error');
            }
        });
    });
}

// Move employee assignment
async function moveEmployee(employeeId, fromProject, toProject, assignmentDate) {
    const moveData = {
        employee_id: employeeId,
        from_project_id: fromProject,
        to_project_id: toProject,
        assignment_date: assignmentDate
    };

    return await api.post('/assignments/move', moveData);
}

// Search Functionality
function initSearch() {
    const searchInput = document.querySelector('.search-container input');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const employeeCards = document.querySelectorAll('.employee-card');

        employeeCards.forEach(card => {
            const name = card.querySelector('.employee-name')?.textContent.toLowerCase() || '';
            const id = card.querySelector('.employee-id')?.textContent.toLowerCase() || '';

            if (name.includes(searchTerm) || id.includes(searchTerm)) {
                card.style.opacity = '1';
                card.style.boxShadow = '0 0 8px rgba(40, 167, 69, 0.6)';
            } else {
                card.style.opacity = '0.5';
                card.style.boxShadow = 'none';
            }
        });

        // Reset highlighting if search is cleared
        if (searchTerm === '') {
            employeeCards.forEach(card => {
                card.style.opacity = '1';
                card.style.boxShadow = 'none';
            });
        }
    });
}

// Week Navigation
function initWeekNavigation() {
    const prevWeekBtn = document.querySelector('.week-navigator button:first-child');
    const nextWeekBtn = document.querySelector('.week-navigator button:last-child');

    if (!prevWeekBtn || !nextWeekBtn) return;

    prevWeekBtn.addEventListener('click', function() {
        navigateWeek(-1);
    });

    nextWeekBtn.addEventListener('click', function() {
        navigateWeek(1);
    });
}

async function navigateWeek(direction) {
    if (!currentWeekStart) return;

    const currentDate = new Date(currentWeekStart);
    currentDate.setDate(currentDate.getDate() + (direction * 7));
    const newWeekStart = currentDate.toISOString().split('T')[0];

    try {
        showLoading(true);
        const data = await api.get(`/dashboard/week/${newWeekStart}`);

        currentWeekStart = newWeekStart;
        renderDashboard(data.data.weekAssignments);
        updateWeekDisplay();

        // Check if this is an archived week
        if (direction < 0) {
            document.querySelector('.dashboard-header')?.classList.add('archive-mode');
        } else {
            document.querySelector('.dashboard-header')?.classList.remove('archive-mode');
        }

    } catch (error) {
        showNotification('Error loading week data: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function updateWeekDisplay() {
    const weekDisplay = document.querySelector('.week-navigator span');
    if (!weekDisplay || !currentWeekStart) return;

    const startDate = new Date(currentWeekStart);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 4); // Friday

    const options = { month: 'long', day: 'numeric' };
    const startStr = startDate.toLocaleDateString('en-US', options);
    const endStr = endDate.toLocaleDateString('en-US', options);
    const year = startDate.getFullYear();

    weekDisplay.textContent = `Week of: ${startStr} - ${endStr}, ${year}`;
}

// Export Functionality
function initExport() {
    const exportButtons = document.querySelectorAll('.export-controls button');

    exportButtons.forEach(button => {
        button.addEventListener('click', function() {
            const format = this.textContent.toLowerCase().includes('excel') ? 'excel' : 'csv';
            performExport(format);
        });
    });
}

async function performExport(format) {
    if (!currentWeekStart) {
        showNotification('No week data available for export', 'error');
        return;
    }



    try {
        showNotification(`Generating ${format.toUpperCase()} export...`, 'info');

        const startDate = currentWeekStart;
        const endDate = new Date(currentWeekStart);
        endDate.setDate(endDate.getDate() + 4);
        const endDateStr = endDate.toISOString().split('T')[0];

        const exportData = {
            startDate,
            endDate: endDateStr,
            includeEmployees: true,
            includeProjects: true,
            includeAssignments: true
        };

        const response = await api.post(`/exports/${format}`, exportData);

        if (response.downloadUrl) {
            // Create download link
            const link = document.createElement('a');
            link.href = API_BASE_URL + response.downloadUrl;
            link.download = response.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showNotification('Export completed successfully!', 'success');
        }

    } catch (error) {
        showNotification('Export failed: ' + error.message, 'error');
    }
}

// WebSocket for real-time updates
function initWebSocket() {
    if (!authToken) return;

    const socketURL = window.location.hostname === 'localhost' ?
        'http://localhost:3001' : window.location.origin;

    socket = io(socketURL);

    socket.on('connect', () => {
        console.log('Connected to WebSocket');
        socket.emit('join-room', {
            userId: 'current-user',
            role: 'user'
        });
    });

    socket.on('assignment-created', (data) => {
        showNotification('New assignment created', 'info');
        loadDashboardData(); // Refresh data
    });

    socket.on('assignment-updated', (data) => {
        showNotification('Assignment updated', 'info');
        loadDashboardData(); // Refresh data
    });

    socket.on('assignment-deleted', (data) => {
        showNotification('Assignment removed', 'info');
        loadDashboardData(); // Refresh data
    });

    socket.on('assignment-moved', (data) => {
        showNotification(`Employee moved to ${data.to_project_id}`, 'info');
        loadDashboardData(); // Refresh data
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
    });
}

// Utility Functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add to document
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function showLoading(show) {
    let loader = document.querySelector('.loading-overlay');

    if (show && !loader) {
        loader = document.createElement('div');
        loader.className = 'loading-overlay';
        loader.innerHTML = '<div class="loading-spinner"></div>';
        document.body.appendChild(loader);
    } else if (!show && loader) {
        loader.remove();
    }
}

function getDateForDay(dayName) {
    if (!currentWeekStart) return null;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayIndex = days.indexOf(dayName);

    if (dayIndex === -1) return null;

    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + dayIndex);
    return date.toISOString().split('T')[0];
}

// Render week grid with assignments
function renderWeekGrid(weekAssignments) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    days.forEach(day => {
        const dayProjects = weekAssignments.days?.[day] || {};

        Object.keys(dayProjects).forEach(projectId => {
            const assignments = dayProjects[projectId];
            const cell = document.querySelector(`[data-day="${day}"][data-project="${projectId}"]`);

            if (cell) {
                cell.innerHTML = ''; // Clear existing content

                assignments.forEach(assignment => {
                    const card = document.createElement('div');
                    card.className = 'employee-card';
                    card.id = `employee-${assignment.employee_id}`;
                    card.setAttribute('data-employee-id', assignment.employee_id);
                    card.setAttribute('draggable', 'true');
                    card.style.borderLeft = `4px solid ${assignment.position_color}`;

                    card.innerHTML = `
                        <div class="employee-name">${assignment.employee_name}</div>
                        <div class="employee-id">${assignment.employee_id}</div>
                        <div class="employee-position">${assignment.position_name}</div>
                    `;

                    cell.appendChild(card);
                });
            }
        });
    });

    // Re-initialize drag and drop
    initDragAndDrop();
}

// Render statistics
function renderStatistics(stats) {
    const statsContainer = document.querySelector('.stats-container');
    if (!statsContainer || !stats.overall) return;

    const activeCount = stats.overall.active_employees || 0;
    const totalCount = stats.overall.total_employees || 0;

    // Update any existing stat displays
    const activeEmployeesElement = document.querySelector('.stat-active-employees');
    if (activeEmployeesElement) {
        activeEmployeesElement.textContent = activeCount;
    }

    const totalEmployeesElement = document.querySelector('.stat-total-employees');
    if (totalEmployeesElement) {
        totalEmployeesElement.textContent = totalCount;
    }
}
