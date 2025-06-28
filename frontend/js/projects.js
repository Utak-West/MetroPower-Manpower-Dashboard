/**
 * Projects View JavaScript
 *
 * Handles the projects view functionality for the MetroPower Dashboard
 *
 * Copyright 2025 The HigherSelf Network
 */

console.log('Projects.js file loaded');

// Global variables
let projects = [];
let filteredProjects = [];
let currentView = 'card';
let projectsCurrentUser = null;
let currentSort = { field: 'name', order: 'asc' };

// Add immediate console log to verify script is loading
console.log('Projects.js script loaded!');

// Initialize projects page when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Projects page DOM loaded, starting initialization...');

    try {
        // Check if required functions exist
        console.log('Checking dependencies...');
        console.log('getCurrentUser exists:', typeof getCurrentUser);
        console.log('api exists:', typeof api);
        console.log('formatDate exists:', typeof formatDate);

        // Initialize components
        console.log('Initializing auth...');
        initializeAuth();

        console.log('Initializing view toggle...');
        initializeViewToggle();

        console.log('Initializing date...');
        initializeDate();

        console.log('Initializing search and filters...');
        initializeSearchAndFilters();

        console.log('Initializing mobile navigation...');
        initializeMobileNavigation();

        // Check authentication and load data
        console.log('Starting authentication check...');
        await checkAuthentication();

        console.log('Projects page initialized successfully');
    } catch (error) {
        console.error('Error during projects page initialization:', error);
        console.error('Error stack:', error.stack);
    }
});

/**
 * Initialize authentication
 */
function initializeAuth() {
    console.log('Auth initialization - projects page');
    // Auth is handled by auth.js which is loaded before this script
    // This function exists for consistency with other pages
}

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
 * Initialize view toggle functionality
 */
function initializeViewToggle() {
    const cardViewBtn = document.getElementById('cardViewBtn');
    const tableViewBtn = document.getElementById('tableViewBtn');

    if (cardViewBtn) {
        cardViewBtn.addEventListener('click', () => switchView('card'));
    }

    if (tableViewBtn) {
        tableViewBtn.addEventListener('click', () => switchView('table'));
    }
}

/**
 * Initialize search and filter functionality
 */
function initializeSearchAndFilters() {
    const searchInput = document.getElementById('projectSearch');
    const statusFilter = document.getElementById('statusFilter');
    const locationFilter = document.getElementById('locationFilter');
    const managerFilter = document.getElementById('managerFilter');
    const dateFromFilter = document.getElementById('dateFromFilter');
    const dateToFilter = document.getElementById('dateToFilter');

    // Add event listeners for real-time search
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }

    // Add event listeners for filters
    [statusFilter, locationFilter, managerFilter, dateFromFilter, dateToFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', applyFilters);
        }
    });
}

/**
 * Debounce function to limit API calls
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Switch between card and table view
 */
function switchView(view) {
    currentView = view;
    
    const cardViewBtn = document.getElementById('cardViewBtn');
    const tableViewBtn = document.getElementById('tableViewBtn');
    const cardView = document.getElementById('cardView');
    const tableView = document.getElementById('tableView');

    // Update button states
    if (cardViewBtn && tableViewBtn) {
        cardViewBtn.classList.toggle('active', view === 'card');
        tableViewBtn.classList.toggle('active', view === 'table');
    }

    // Show/hide views
    if (cardView && tableView) {
        cardView.style.display = view === 'card' ? 'grid' : 'none';
        tableView.style.display = view === 'table' ? 'block' : 'none';
    }

    // Render current data in the selected view
    if (projects.length > 0) {
        if (view === 'card') {
            renderProjectCards(projects);
        } else {
            renderProjectTable(projects);
        }
    }
}

/**
 * Check authentication and load projects
 */
async function checkAuthentication() {
    try {
        console.log('Checking authentication...');
        let user = await getCurrentUser();
        console.log('User retrieved:', user);

        // If no user found, try demo bypass first
        if (!user) {
            console.log('No user found, attempting demo bypass...');
            try {
                const response = await api.demoBypass();
                console.log('Demo bypass successful:', response);
                user = response.user;

                if (typeof showNotification === 'function') {
                    showNotification('Demo login successful', 'success');
                }
            } catch (demoError) {
                console.error('Demo bypass failed:', demoError);
                console.log('Redirecting to login page...');
                window.location.href = '/index.html';
                return;
            }
        }

        // Store current user
        projectsCurrentUser = user;
        console.log('Current user set:', projectsCurrentUser);

        // Update user display
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');
        const userInfo = document.getElementById('userInfo');

        if (userName) {
            userName.textContent = `${user.first_name} ${user.last_name}`;
        }

        if (userRole) {
            userRole.textContent = user.role;
        }

        if (userInfo) {
            userInfo.style.display = 'flex';
        }

        // Initialize project management features
        initializeProjectManagement();

        // Load projects data
        console.log('Loading projects...');
        await loadProjects();

    } catch (error) {
        console.error('Authentication check failed:', error);
        showErrorState();
        // Don't redirect immediately, let user see the error
        // window.location.href = '/index.html';
    }
}

/**
 * Load projects data
 */
async function loadProjects() {
    try {
        console.log('Starting to load projects...');
        showLoadingState();

        console.log('Making API call to get projects...');
        const response = await api.getProjects({ withStats: true });
        console.log('API response received:', response);

        projects = response.data || [];
        console.log('Projects loaded:', projects.length);

        // Initialize filter options
        populateFilterOptions();

        // Apply initial filters
        filteredProjects = [...projects];
        console.log('Filtered projects before applyFilters:', filteredProjects.length);
        applyFilters();

        console.log('About to hide loading state and show projects...');
        hideLoadingState();

        // Show success notification
        if (typeof showNotification === 'function' && projects.length > 0) {
            showNotification(`Successfully loaded ${projects.length} project${projects.length === 1 ? '' : 's'}`, 'success', 3000);
        }

    } catch (error) {
        console.error('Error loading projects:', error);
        console.error('Error details:', error.message, error.stack);
        hideLoadingState();

        let errorMessage = 'Failed to load projects. Please check your connection and try again.';
        if (error.message.includes('Authentication')) {
            errorMessage = 'Authentication failed. Please refresh the page to log in again.';
        } else if (error.message.includes('Network')) {
            errorMessage = 'Network error. Please check your internet connection.';
        }

        showErrorState(errorMessage);

        if (typeof showNotification === 'function') {
            showNotification(errorMessage, 'error');
        }
    }
}

/**
 * Show loading state
 */
function showLoadingState() {
    const loadingState = document.getElementById('loadingState');
    const cardView = document.getElementById('cardView');
    const tableView = document.getElementById('tableView');
    const errorState = document.getElementById('errorState');

    if (loadingState) {
        loadingState.style.display = 'block';
        loadingState.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Loading projects...</p>
            <small>Please wait while we fetch your project data</small>
        `;
    }
    if (cardView) cardView.style.display = 'none';
    if (tableView) tableView.style.display = 'none';
    if (errorState) errorState.style.display = 'none';
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) loadingState.style.display = 'none';

    // Show the appropriate view
    const cardView = document.getElementById('cardView');
    const tableView = document.getElementById('tableView');

    if (currentView === 'card') {
        if (cardView) cardView.style.display = 'grid';
        if (tableView) tableView.style.display = 'none';
    } else {
        if (cardView) cardView.style.display = 'none';
        if (tableView) tableView.style.display = 'block';
    }
}

/**
 * Show error state
 */
function showErrorState(message = 'Failed to load projects. Please try again.') {
    const errorState = document.getElementById('errorState');
    const cardView = document.getElementById('cardView');
    const tableView = document.getElementById('tableView');

    if (errorState) {
        errorState.style.display = 'block';
        errorState.innerHTML = `
            <div class="error-icon">⚠️</div>
            <h3>Oops! Something went wrong</h3>
            <p>${message}</p>
            <div class="error-actions">
                <button type="button" class="btn btn-primary" onclick="loadProjects()">Try Again</button>
                <button type="button" class="btn btn-secondary" onclick="window.location.reload()">Refresh Page</button>
            </div>
        `;
    }
    if (cardView) cardView.style.display = 'none';
    if (tableView) tableView.style.display = 'none';
}

/**
 * Show empty state
 */
function showEmptyState() {
    const cardView = document.getElementById('cardView');
    const tableView = document.getElementById('tableView');

    const emptyMessage = '<div class="empty-state"><p>No projects found.</p></div>';

    if (currentView === 'card' && cardView) {
        cardView.innerHTML = emptyMessage;
        cardView.style.display = 'grid';
    } else if (tableView) {
        const tbody = document.getElementById('projectsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No projects found.</td></tr>';
        }
        tableView.style.display = 'block';
    }
}

/**
 * Populate filter dropdown options
 */
function populateFilterOptions() {
    if (!projects || projects.length === 0) return;

    // Populate location filter
    const locationFilter = document.getElementById('locationFilter');
    if (locationFilter) {
        const locations = [...new Set(projects.map(p => p.location).filter(Boolean))];
        locationFilter.innerHTML = '<option value="">All Locations</option>' +
            locations.map(location => `<option value="${location}">${location}</option>`).join('');
    }

    // Populate manager filter
    const managerFilter = document.getElementById('managerFilter');
    if (managerFilter) {
        const managers = [...new Set(projects.map(p => p.manager_name).filter(Boolean))];
        managerFilter.innerHTML = '<option value="">All Managers</option>' +
            managers.map(manager => `<option value="${manager}">${manager}</option>`).join('');
    }
}

/**
 * Apply search and filters
 */
function applyFilters() {
    if (!projects || projects.length === 0) {
        filteredProjects = [];
        renderFilteredProjects();
        return;
    }

    const searchTerm = document.getElementById('projectSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const locationFilter = document.getElementById('locationFilter')?.value || '';
    const managerFilter = document.getElementById('managerFilter')?.value || '';
    const dateFromFilter = document.getElementById('dateFromFilter')?.value || '';
    const dateToFilter = document.getElementById('dateToFilter')?.value || '';

    filteredProjects = projects.filter(project => {
        // Search filter
        if (searchTerm) {
            const searchableText = [
                project.name,
                project.number,
                project.project_id,
                project.location,
                project.manager_name,
                project.description
            ].filter(Boolean).join(' ').toLowerCase();

            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }

        // Status filter
        if (statusFilter && project.status !== statusFilter) {
            return false;
        }

        // Location filter
        if (locationFilter && project.location !== locationFilter) {
            return false;
        }

        // Manager filter
        if (managerFilter && project.manager_name !== managerFilter) {
            return false;
        }

        // Date range filters
        if (dateFromFilter && project.start_date) {
            const projectDate = new Date(project.start_date);
            const fromDate = new Date(dateFromFilter);
            if (projectDate < fromDate) {
                return false;
            }
        }

        if (dateToFilter && project.start_date) {
            const projectDate = new Date(project.start_date);
            const toDate = new Date(dateToFilter);
            if (projectDate > toDate) {
                return false;
            }
        }

        return true;
    });

    // Apply sorting
    applySorting();

    // Render filtered results
    renderFilteredProjects();
}

/**
 * Apply sorting to filtered projects
 */
function applySorting() {
    if (!filteredProjects || filteredProjects.length === 0) return;

    filteredProjects.sort((a, b) => {
        let aValue = a[currentSort.field];
        let bValue = b[currentSort.field];

        // Handle different data types
        if (currentSort.field === 'budget') {
            aValue = parseFloat(aValue) || 0;
            bValue = parseFloat(bValue) || 0;
        } else if (currentSort.field === 'start_date' || currentSort.field === 'end_date') {
            aValue = new Date(aValue || '1900-01-01');
            bValue = new Date(bValue || '1900-01-01');
        } else {
            aValue = String(aValue || '').toLowerCase();
            bValue = String(bValue || '').toLowerCase();
        }

        if (aValue < bValue) return currentSort.order === 'asc' ? -1 : 1;
        if (aValue > bValue) return currentSort.order === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Render filtered projects
 */
function renderFilteredProjects() {
    console.log('renderFilteredProjects called with:', filteredProjects.length, 'projects');
    console.log('Current view:', currentView);

    if (filteredProjects.length === 0) {
        console.log('No projects to show, showing empty state');
        showEmptyState();
    } else {
        console.log('Rendering projects in', currentView, 'view');
        if (currentView === 'card') {
            renderProjectCards(filteredProjects);
        } else {
            renderProjectTable(filteredProjects);
        }
    }
}

/**
 * Clear search input
 */
function clearSearch() {
    const searchInput = document.getElementById('projectSearch');
    if (searchInput) {
        searchInput.value = '';
        applyFilters();
    }
}

/**
 * Clear all filters
 */
function clearAllFilters() {
    const searchInput = document.getElementById('projectSearch');
    const statusFilter = document.getElementById('statusFilter');
    const locationFilter = document.getElementById('locationFilter');
    const managerFilter = document.getElementById('managerFilter');
    const dateFromFilter = document.getElementById('dateFromFilter');
    const dateToFilter = document.getElementById('dateToFilter');

    [searchInput, statusFilter, locationFilter, managerFilter, dateFromFilter, dateToFilter].forEach(element => {
        if (element) element.value = '';
    });

    applyFilters();
}

/**
 * Sort projects by field
 */
function sortProjects(field) {
    // Toggle sort order if clicking the same field
    if (currentSort.field === field) {
        currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.order = 'asc';
    }

    // Update sort indicators
    updateSortIndicators();

    // Apply sorting and re-render
    applySorting();
    renderFilteredProjects();
}

/**
 * Update sort indicators in table headers
 */
function updateSortIndicators() {
    // Clear all indicators
    document.querySelectorAll('.sort-indicator').forEach(indicator => {
        indicator.className = 'sort-indicator';
    });

    // Set current sort indicator
    const currentIndicator = document.getElementById(`sort-${currentSort.field}`);
    if (currentIndicator) {
        currentIndicator.className = `sort-indicator ${currentSort.order}`;
    }
}

/**
 * Render project cards
 */
function renderProjectCards(projectsData) {
    console.log('renderProjectCards called with', projectsData.length, 'projects');
    const cardView = document.getElementById('cardView');
    if (!cardView) {
        console.error('cardView element not found!');
        return;
    }
    console.log('cardView element found, rendering cards...');

    const cardsHTML = projectsData.map(project => {
        const statusClass = `status-${project.status.toLowerCase().replace(' ', '-')}`;
        const budget = project.budget ? `$${Number(project.budget).toLocaleString()}` : 'N/A';

        // Fallback formatDate function if not available
        const formatDateFallback = (date) => {
            if (typeof formatDate === 'function') {
                return formatDate(date);
            }
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        };

        const lastAssignment = project.lastAssignmentDate
            ? formatDateFallback(new Date(project.lastAssignmentDate))
            : 'Never';

        return `
            <div class="project-card" onclick="openProjectModal('${project.project_id}')">
                <div class="project-header">
                    <div>
                        <h3 class="project-name">${project.name}</h3>
                        <p class="project-number">Project #${project.number || project.project_id}</p>
                    </div>
                    <span class="project-status ${statusClass}">${project.status}</span>
                </div>
                
                <div class="project-details">
                    <div class="project-detail">
                        <span class="project-detail-label">Location:</span>
                        <span class="project-detail-value">${project.location || 'N/A'}</span>
                    </div>
                    <div class="project-detail">
                        <span class="project-detail-label">Budget:</span>
                        <span class="project-detail-value">${budget}</span>
                    </div>
                    <div class="project-detail">
                        <span class="project-detail-label">Last Assignment:</span>
                        <span class="project-detail-value">${lastAssignment}</span>
                    </div>
                </div>

                <div class="project-metrics">
                    <div class="metric">
                        <p class="metric-value">${project.currentAssignments || 0}</p>
                        <p class="metric-label">Today</p>
                    </div>
                    <div class="metric">
                        <p class="metric-value">${project.totalAssignments || 0}</p>
                        <p class="metric-label">Total</p>
                    </div>
                    <div class="metric">
                        <p class="metric-value">${project.uniqueEmployees || 0}</p>
                        <p class="metric-label">Staff</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    console.log('Generated cards HTML length:', cardsHTML.length);
    cardView.innerHTML = cardsHTML;
    cardView.style.display = 'grid';
    console.log('Cards rendered successfully, cardView display set to grid');
}

/**
 * Render project table
 */
function renderProjectTable(projectsData) {
    const tbody = document.getElementById('projectsTableBody');
    if (!tbody) return;

    const rowsHTML = projectsData.map(project => {
        const statusClass = `status-${project.status.toLowerCase().replace(' ', '-')}`;
        const budget = project.budget ? `$${Number(project.budget).toLocaleString()}` : 'N/A';

        return `
            <tr onclick="openProjectModal('${project.project_id}')" style="cursor: pointer;">
                <td>${project.name}</td>
                <td>${project.number || project.project_id}</td>
                <td><span class="project-status ${statusClass}">${project.status}</span></td>
                <td>${project.location || 'N/A'}</td>
                <td>${project.currentAssignments || 0}</td>
                <td>${project.totalAssignments || 0}</td>
                <td>${budget}</td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rowsHTML;
    
    const tableView = document.getElementById('tableView');
    if (tableView) tableView.style.display = 'block';
}

/**
 * Open project detail modal
 */
async function openProjectModal(projectId) {
    try {
        const project = projects.find(p => p.project_id.toString() === projectId.toString());
        if (!project) {
            showNotification('Project not found', 'error');
            return;
        }

        // Update modal title
        updateElement('modalProjectName', project.name);

        // Show modal
        const modal = document.getElementById('projectModal');
        if (modal) modal.style.display = 'flex';

        // Load detailed project data
        await loadProjectDetails(projectId);

    } catch (error) {
        console.error('Error opening project modal:', error);
        showNotification('Failed to load project details', 'error');
    }
}

/**
 * Close project modal
 */
function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    if (modal) modal.style.display = 'none';
}

/**
 * Edit project
 */
function editProject(projectId) {
    if (!projectsCurrentUser || !['Project Manager', 'Admin', 'Super Admin'].includes(projectsCurrentUser.role)) {
        showNotification('Only managers can edit projects', 'error');
        return;
    }

    const project = projects.find(p => p.project_id.toString() === projectId.toString());
    if (!project) {
        showNotification('Project not found', 'error');
        return;
    }

    // Close project modal and open edit modal
    closeProjectModal();

    // Populate edit form with current project data
    populateEditForm(project);

    // Show edit modal
    const editModal = document.getElementById('createProjectModal');
    if (editModal) {
        // Change modal title
        const modalTitle = editModal.querySelector('h2');
        if (modalTitle) modalTitle.textContent = 'Edit Project';

        // Change submit button text
        const submitBtn = document.getElementById('submitProjectBtn');
        if (submitBtn) submitBtn.textContent = 'Update Project';

        // Change form action
        const form = document.getElementById('createProjectForm');
        if (form) {
            form.setAttribute('data-project-id', projectId);
            form.setAttribute('data-mode', 'edit');
        }

        editModal.style.display = 'flex';
    }
}

/**
 * Populate edit form with project data
 */
function populateEditForm(project) {
    const fields = {
        'projectName': project.name,
        'projectNumber': project.number,
        'projectDescription': project.description,
        'projectLocation': project.location,
        'projectStartDate': project.start_date ? project.start_date.split('T')[0] : '',
        'projectEndDate': project.end_date ? project.end_date.split('T')[0] : '',
        'projectBudget': project.budget,
        'projectStatus': project.status
    };

    Object.entries(fields).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field && value !== null && value !== undefined) {
            field.value = value;
        }
    });
}

/**
 * Delete project
 */
async function deleteProject(projectId) {
    if (!projectsCurrentUser || !['Project Manager', 'Admin', 'Super Admin'].includes(projectsCurrentUser.role)) {
        showNotification('Only managers can delete projects', 'error');
        return;
    }

    const project = projects.find(p => p.project_id.toString() === projectId.toString());
    if (!project) {
        showNotification('Project not found', 'error');
        return;
    }

    const confirmed = confirm(`Are you sure you want to delete project "${project.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
        // In demo mode, just remove from local array
        const index = projects.findIndex(p => p.project_id.toString() === projectId.toString());
        if (index > -1) {
            projects.splice(index, 1);
            filteredProjects = filteredProjects.filter(p => p.project_id.toString() !== projectId.toString());

            closeProjectModal();
            renderFilteredProjects();
            showNotification('Project deleted successfully', 'success');
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        showNotification('Failed to delete project', 'error');
    }
}

/**
 * Export project report
 */
function exportProjectReport(projectId) {
    const project = projects.find(p => p.project_id.toString() === projectId.toString());
    if (!project) {
        showNotification('Project not found', 'error');
        return;
    }

    // Create CSV content
    const csvContent = generateProjectReportCSV(project);

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.name}_report.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Project report exported successfully', 'success');
}

/**
 * Generate project report CSV content
 */
function generateProjectReportCSV(project) {
    const headers = ['Field', 'Value'];
    const rows = [
        ['Project Name', project.name],
        ['Project Number', project.number || project.project_id],
        ['Status', project.status],
        ['Location', project.location || 'N/A'],
        ['Description', project.description || 'N/A'],
        ['Start Date', project.start_date ? formatDate(new Date(project.start_date)) : 'N/A'],
        ['End Date', project.end_date ? formatDate(new Date(project.end_date)) : 'N/A'],
        ['Budget', project.budget ? `$${Number(project.budget).toLocaleString()}` : 'N/A'],
        ['Current Assignments', project.currentAssignments || 0],
        ['Total Assignments', project.totalAssignments || 0],
        ['Manager', project.manager_name || 'N/A']
    ];

    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

    return csvContent;
}

/**
 * Load detailed project data
 */
async function loadProjectDetails(projectId) {
    try {
        const modalContent = document.getElementById('modalProjectContent');
        if (modalContent) {
            modalContent.innerHTML = '<div class="loading">Loading project details...</div>';
        }

        const response = await api.getProjectDetails(projectId);
        const project = response.data;

        // Get current week assignments for this project
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay() + 1));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        let assignmentsHTML = '';
        if (project.currentAssignments && project.currentAssignments.length > 0) {
            assignmentsHTML = `
                <div class="current-assignments">
                    <h4>Current Week Assignments</h4>
                    <div class="assignments-list">
                        ${project.currentAssignments.map(assignment => `
                            <div class="assignment-item">
                                <strong>${assignment.employee.name}</strong> - ${assignment.date}
                                <br><small>${assignment.employee.position || 'N/A'}</small>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (modalContent) {
            modalContent.innerHTML = `
                <div class="project-detail-content">
                    <div class="project-summary">
                        <div class="project-header-info">
                            <h3>${project.name}</h3>
                            <span class="status-badge status-${project.status.toLowerCase().replace(' ', '-')}">${project.status}</span>
                        </div>
                        <p class="project-description">${project.description || 'No description available'}</p>
                    </div>

                    <div class="project-info-grid">
                        <div class="info-section">
                            <h4>Project Details</h4>
                            <div class="info-row">
                                <span class="info-label">Project Number:</span>
                                <span class="info-value">${project.number || project.project_id}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Location:</span>
                                <span class="info-value">${project.location || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Budget:</span>
                                <span class="info-value">${project.budget ? `$${Number(project.budget).toLocaleString()}` : 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Manager:</span>
                                <span class="info-value">${project.manager_name || 'N/A'}</span>
                            </div>
                        </div>

                        <div class="info-section">
                            <h4>Timeline & Progress</h4>
                            <div class="info-row">
                                <span class="info-label">Start Date:</span>
                                <span class="info-value">${project.start_date ? formatDate(new Date(project.start_date)) : 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">End Date:</span>
                                <span class="info-value">${project.end_date ? formatDate(new Date(project.end_date)) : 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Current Staff:</span>
                                <span class="info-value">${project.currentAssignments || 0}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Total Assignments:</span>
                                <span class="info-value">${project.totalAssignments || 0}</span>
                            </div>
                        </div>
                    </div>

                    ${assignmentsHTML}

                    <div class="project-actions">
                        <button type="button" class="btn btn-secondary" onclick="viewProjectCalendar('${projectId}')">
                            <i class="icon-calendar"></i> View in Calendar
                        </button>
                        <button type="button" class="btn btn-primary" onclick="exportProjectReport('${projectId}')">
                            <i class="icon-download"></i> Export Report
                        </button>
                        ${projectsCurrentUser && ['Project Manager', 'Admin', 'Super Admin'].includes(projectsCurrentUser.role) ? `
                            <button type="button" class="btn btn-warning" onclick="editProject('${projectId}')">
                                <i class="icon-edit"></i> Edit Project
                            </button>
                            <button type="button" class="btn btn-danger" onclick="deleteProject('${projectId}')">
                                <i class="icon-delete"></i> Delete Project
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error loading project details:', error);
        const modalContent = document.getElementById('modalProjectContent');
        if (modalContent) {
            modalContent.innerHTML = '<div class="error">Failed to load project details</div>';
        }
    }
}

/**
 * Export projects data with enhanced UI feedback
 */
async function exportProjects(format = 'excel') {
    const exportButtons = document.querySelectorAll('.project-actions button, .export-format-options button');
    const activeButton = Array.from(exportButtons).find(btn =>
        btn.textContent.toLowerCase().includes(format.toLowerCase()) ||
        (format === 'excel' && btn.textContent.toLowerCase().includes('export'))
    );

    try {
        // Show loading state
        if (activeButton) {
            activeButton.classList.add('exporting');
            activeButton.disabled = true;
        }

        showNotification(`Preparing projects ${format.toUpperCase()} export...`, 'info');

        const response = await fetch(`${api.baseURL}/exports/projects?format=${format}`, {
            headers: api.getHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Export failed with status ${response.status}`);
        }

        if (format === 'excel' || format === 'pdf' || format === 'csv') {
            showNotification('Generating file and starting download...', 'info');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;

            const dateStr = new Date().toISOString().split('T')[0];
            const fileExtension = format === 'excel' ? 'xlsx' : format;
            a.download = `metropower_projects_${dateStr}.${fileExtension}`;

            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showNotification(`Projects exported as ${format.toUpperCase()} successfully!`, 'success');
        } else {
            const data = await response.json();
            console.log('Export data:', data);
            showNotification('Export completed!', 'success');
        }

    } catch (error) {
        console.error('Error exporting projects:', error);
        showNotification(`Projects export failed: ${error.message}`, 'error');
    } finally {
        // Reset button state
        if (activeButton) {
            activeButton.classList.remove('exporting');
            activeButton.disabled = false;
        }
    }
}

/**
 * Show export options modal for projects
 */
function showProjectExportModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2>Export Projects</h2>
                <button class="modal-close" onclick="closeExportModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Export Format:</label>
                    <div class="export-format-options">
                        <button type="button" class="btn btn-secondary" onclick="exportProjects('excel')">
                            📊 Excel (.xlsx)
                        </button>
                        <button type="button" class="btn btn-primary" onclick="exportProjects('pdf')">
                            📄 PDF Report
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="exportProjects('csv')">
                            📋 CSV Data
                        </button>
                    </div>
                </div>
                <div class="export-info">
                    <p><strong>Excel:</strong> Comprehensive spreadsheet with all project data and formatting</p>
                    <p><strong>PDF:</strong> Professional report with MetroPower branding</p>
                    <p><strong>CSV:</strong> Raw data for import into other systems</p>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeExportModal();
        }
    });
}

/**
 * Close export modal
 */
function closeExportModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

/**
 * View project in calendar
 */
function viewProjectCalendar(projectId) {
    // Find project name for better UX
    const project = projects.find(p => p.project_id === projectId);
    const projectName = project ? project.name : projectId;

    // Show notification about navigation
    showNotification(`Opening calendar view for ${projectName}...`, 'info');

    // Navigate to calendar view with project filter
    window.location.href = `/calendar.html?project=${projectId}`;
}



/**
 * Show create project modal
 */
function showCreateProjectModal() {
    // Check if user is a manager
    if (!projectsCurrentUser || !['Project Manager', 'Admin', 'Super Admin'].includes(projectsCurrentUser.role)) {
        showNotification('Only managers can create projects', 'error');
        return;
    }

    const modal = document.getElementById('createProjectModal');
    if (modal) {
        modal.style.display = 'flex';

        // Set default values
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('projectStartDate').value = today;

        // Clear form
        document.getElementById('createProjectForm').reset();
        document.getElementById('projectStartDate').value = today;
    }
}

/**
 * Hide create project modal
 */
function hideCreateProjectModal() {
    const modal = document.getElementById('createProjectModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('createProjectForm').reset();

        // Reset modal to create mode
        const modalTitle = document.querySelector('#createProjectModal .modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Create New Project';
        }

        // Reset project ID field
        const projectIdField = document.getElementById('projectId');
        if (projectIdField) {
            projectIdField.readOnly = false;
        }

        // Reset create button
        const createBtn = document.querySelector('#createProjectModal .modal-footer .btn-primary');
        if (createBtn) {
            createBtn.textContent = 'Create Project';
            createBtn.onclick = createProject;
        }
    }
}

/**
 * Submit project (create or update based on form mode)
 */
async function submitProject() {
    const form = document.getElementById('createProjectForm');
    const mode = form.getAttribute('data-mode') || 'create';
    const projectId = form.getAttribute('data-project-id');

    if (mode === 'edit' && projectId) {
        await updateProject(projectId);
    } else {
        await createProject();
    }
}

/**
 * Create new project
 */
async function createProject() {
    try {
        const form = document.getElementById('createProjectForm');
        const formData = new FormData(form);

        // Convert FormData to object
        const projectData = {};
        for (let [key, value] of formData.entries()) {
            if (value.trim()) {
                projectData[key] = value.trim();
            }
        }

        // Validate required fields
        if (!projectData.name || !projectData.location || !projectData.start_date) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Validate dates
        if (projectData.end_date && new Date(projectData.start_date) > new Date(projectData.end_date)) {
            showNotification('Start date cannot be after end date', 'error');
            return;
        }

        // Show loading
        showLoading(true);

        // Create project via API
        const response = await api.post('/projects', projectData);

        if (response.success) {
            showNotification('Project created successfully', 'success');
            hideCreateProjectModal();

            // Reload projects to show the new one
            await loadProjects();
        } else {
            showNotification(response.message || 'Failed to create project', 'error');
        }

    } catch (error) {
        console.error('Error creating project:', error);
        showNotification(`Failed to create project: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}



/**
 * Update existing project
 */
async function updateProject(projectId) {
    try {
        const form = document.getElementById('createProjectForm');
        const formData = new FormData(form);

        // Convert FormData to object
        const projectData = {};
        for (let [key, value] of formData.entries()) {
            if (value.trim()) {
                projectData[key] = value.trim();
            }
        }

        // Validate required fields
        if (!projectData.name || !projectData.location || !projectData.start_date) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Validate dates
        if (projectData.end_date && new Date(projectData.start_date) > new Date(projectData.end_date)) {
            showNotification('Start date cannot be after end date', 'error');
            return;
        }

        // Show loading
        showLoading(true);

        // Update project via API
        const response = await api.updateProject(projectId, projectData);

        if (response.success) {
            showNotification('Project updated successfully', 'success');
            hideCreateProjectModal();

            // Reload projects to show the updated data
            await loadProjects();
        } else {
            showNotification(response.message || 'Failed to update project', 'error');
        }

    } catch (error) {
        console.error('Error updating project:', error);
        showNotification(`Failed to update project: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Initialize project management features
 */
function initializeProjectManagement() {
    // Show/hide create button based on user role
    const createBtn = document.getElementById('createProjectBtn');
    if (createBtn && projectsCurrentUser) {
        if (['Project Manager', 'Admin', 'Super Admin'].includes(projectsCurrentUser.role)) {
            createBtn.style.display = 'inline-flex';
        } else {
            createBtn.style.display = 'none';
        }
    }
}
