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
let isDemoMode = false;
let demoSessionTimeout = null;

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

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    // Check if demo mode is enabled
    try {
        const demoCheck = await fetch('/api/debug/demo-enabled');
        const demoData = await demoCheck.json();

        if (!demoData.demoEnabled) {
            // Demo mode disabled, hide demo button in login modal
            window.demoModeDisabled = true;
        }
    } catch (error) {
        console.log('Could not check demo mode status');
    }

    // Check authentication
    if (!api.token) {
        showLoginModal();
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

    const demoModeSection = window.demoModeDisabled ? '' : `
        <div class="demo-mode-section">
            <div class="demo-divider">
                <span>OR</span>
            </div>
            <button type="button" id="demoModeBtn" class="demo-mode-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10,17 15,12 10,7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                Enter Demo Mode as Antoine Harrell
            </button>
            <p class="demo-description">
                Explore the dashboard with sample data as Assistant Project Manager.
                Perfect for testing features before deployment.
            </p>
        </div>
    `;

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

            ${demoModeSection}

            <div class="demo-credentials">
                <p><strong>Full Access Credentials:</strong></p>
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

        try {
            const response = await api.post('/auth/login', { identifier, password });
            api.setToken(response.accessToken);
            modal.remove();
            initDashboard();
            loadDashboardData();
        } catch (error) {
            document.querySelector('.login-error').textContent = error.message;
            document.querySelector('.login-error').style.display = 'block';
        }
    });

    // Demo mode handler (only if demo mode is enabled)
    const demoBtn = document.getElementById('demoModeBtn');
    if (demoBtn) {
        demoBtn.addEventListener('click', () => {
            enterDemoMode();
            modal.remove();
        });
    }
}

// Demo Mode Implementation
function enterDemoMode() {
    isDemoMode = true;

    // Set demo user info
    const demoUser = {
        name: 'Antoine Harrell',
        role: 'Assistant Project Manager',
        email: 'antoine.harrell@metropower.com',
        branch: 'Tucker Branch'
    };

    // Update user display
    updateUserDisplay(demoUser);

    // Add demo mode banner
    addDemoModeBanner();

    // Load demo data
    loadDemoData();

    // Set session timeout (30 minutes)
    setDemoSessionTimeout();

    // Initialize dashboard with demo data
    initDashboard();

    showNotification('Demo Mode Active - Logged in as Antoine Harrell', 'info');
}

function updateUserDisplay(user) {
    const userNameElement = document.querySelector('.user-name');
    const userRoleElement = document.querySelector('.user-role');

    if (userNameElement) userNameElement.textContent = user.name;
    if (userRoleElement) userRoleElement.textContent = user.role;
}

function addDemoModeBanner() {
    // Remove existing banner if present
    const existingBanner = document.querySelector('.demo-mode-banner');
    if (existingBanner) existingBanner.remove();

    const banner = document.createElement('div');
    banner.className = 'demo-mode-banner';
    banner.innerHTML = `
        <div class="demo-banner-content">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>DEMO MODE - Sample Data Only | Session expires in <span id="demo-timer">30:00</span></span>
            <button type="button" id="exitDemoBtn" class="exit-demo-btn">Exit Demo</button>
        </div>
    `;

    // Insert banner at top of dashboard
    const dashboardContainer = document.querySelector('.dashboard-container');
    dashboardContainer.insertBefore(banner, dashboardContainer.firstChild);

    // Add exit demo handler
    document.getElementById('exitDemoBtn').addEventListener('click', exitDemoMode);
}

function setDemoSessionTimeout() {
    // Clear existing timeout
    if (demoSessionTimeout) {
        clearTimeout(demoSessionTimeout);
    }

    let timeLeft = 30 * 60; // 30 minutes in seconds

    // Update timer display every second
    const timerInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timerElement = document.getElementById('demo-timer');

        if (timerElement) {
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            exitDemoMode();
        }
    }, 1000);

    // Set main timeout
    demoSessionTimeout = setTimeout(() => {
        clearInterval(timerInterval);
        exitDemoMode();
    }, 30 * 60 * 1000); // 30 minutes
}

function exitDemoMode() {
    isDemoMode = false;

    // Clear timeout
    if (demoSessionTimeout) {
        clearTimeout(demoSessionTimeout);
        demoSessionTimeout = null;
    }

    // Remove demo banner
    const banner = document.querySelector('.demo-mode-banner');
    if (banner) banner.remove();

    // Show login modal again
    showNotification('Demo session ended', 'info');
    setTimeout(() => {
        showLoginModal();
    }, 1000);
}

function loadDemoData() {
    // Set demo week start (current week)
    const today = new Date();
    const monday = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    currentWeekStart = monday.toISOString().split('T')[0];

    // Demo employees data
    employees = [
        { employee_id: 'EMP001', name: 'John Smith', position_name: 'Electrician', position_color: '#28A745' },
        { employee_id: 'EMP002', name: 'Mike Johnson', position_name: 'Apprentice', position_color: '#F7B731' },
        { employee_id: 'EMP003', name: 'Sarah Davis', position_name: 'Field Supervisor', position_color: '#3B5998' },
        { employee_id: 'EMP004', name: 'Robert Wilson', position_name: 'General Laborer', position_color: '#6F42C1' },
        { employee_id: 'EMP005', name: 'Lisa Brown', position_name: 'Electrician', position_color: '#28A745' }
    ];

    // Demo projects data
    projects = [
        { project_id: 'PROJ-T-001', name: 'Tucker Mall Renovation', status: 'Active' },
        { project_id: 'PROJ-T-002', name: 'Office Complex Wiring', status: 'Active' },
        { project_id: 'PROJ-T-003', name: 'Residential Development', status: 'Active' },
        { project_id: 'PROJ-T-004', name: 'Industrial Facility', status: 'Active' }
    ];

    // Demo assignments data
    assignments = {
        days: {
            Monday: {
                'PROJ-T-001': [
                    { employee_id: 'EMP001', employee_name: 'John Smith', position_name: 'Electrician', position_color: '#28A745' },
                    { employee_id: 'EMP003', employee_name: 'Sarah Davis', position_name: 'Field Supervisor', position_color: '#3B5998' }
                ],
                'PROJ-T-002': [
                    { employee_id: 'EMP002', employee_name: 'Mike Johnson', position_name: 'Apprentice', position_color: '#F7B731' }
                ]
            },
            Tuesday: {
                'PROJ-T-001': [
                    { employee_id: 'EMP001', employee_name: 'John Smith', position_name: 'Electrician', position_color: '#28A745' },
                    { employee_id: 'EMP005', employee_name: 'Lisa Brown', position_name: 'Electrician', position_color: '#28A745' }
                ],
                'PROJ-T-003': [
                    { employee_id: 'EMP004', employee_name: 'Robert Wilson', position_name: 'General Laborer', position_color: '#6F42C1' }
                ]
            }
        }
    };

    // Render demo data
    renderDashboard({
        unassignedToday: employees.slice(0, 2), // Show some as unassigned
        weekAssignments: assignments,
        employeeStatistics: {
            overall: {
                active_employees: 5,
                total_employees: 8
            }
        }
    });

    updateWeekDisplay();
}

// Dashboard initialization
async function initDashboard() {
    if (isDemoMode) {
        console.log('Demo mode - skipping authentication');
        return;
    }

    try {
        // Verify token is still valid
        await api.get('/auth/verify');
        console.log('Authentication verified');
    } catch (error) {
        showLoginModal();
    }
}

// Load dashboard data
async function loadDashboardData() {
    if (isDemoMode) {
        // Demo mode already has data loaded
        return;
    }

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
    if (isDemoMode) {
        // In demo mode, just simulate the move without API call
        showNotification('Demo Mode: Employee move simulated (changes not saved)', 'info');
        return { success: true };
    }

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

    if (isDemoMode) {
        showNotification(`Demo Mode: ${format.toUpperCase()} export simulated (contains sample data watermarks)`, 'info');
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
