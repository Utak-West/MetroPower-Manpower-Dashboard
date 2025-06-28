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
let currentView = 'card';
let currentUser = null;

// Initialize projects page when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Projects page initializing...');

    // Initialize components
    initializeAuth();
    initializeViewToggle();
    initializeDate();

    // Check authentication and load data
    await checkAuthentication();

    console.log('Projects page initialized');
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
        const user = await getCurrentUser();
        console.log('User retrieved:', user);

        if (!user) {
            console.log('No user found, redirecting to login');
            window.location.href = '/index.html';
            return;
        }

        // Store current user
        currentUser = user;
        console.log('Current user set:', currentUser);

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

        hideLoadingState();

        if (projects.length === 0) {
            console.log('No projects found, showing empty state');
            showEmptyState();
        } else {
            console.log('Rendering projects in', currentView, 'view');
            if (currentView === 'card') {
                renderProjectCards(projects);
            } else {
                renderProjectTable(projects);
            }
        }

    } catch (error) {
        console.error('Error loading projects:', error);
        console.error('Error details:', error.message, error.stack);
        hideLoadingState();
        showErrorState();
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

    if (loadingState) loadingState.style.display = 'block';
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
function showErrorState() {
    const errorState = document.getElementById('errorState');
    const cardView = document.getElementById('cardView');
    const tableView = document.getElementById('tableView');

    if (errorState) errorState.style.display = 'block';
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
 * Render project cards
 */
function renderProjectCards(projectsData) {
    const cardView = document.getElementById('cardView');
    if (!cardView) return;

    const cardsHTML = projectsData.map(project => {
        const statusClass = `status-${project.status.toLowerCase().replace(' ', '-')}`;
        const budget = project.budget ? `$${Number(project.budget).toLocaleString()}` : 'N/A';
        const lastAssignment = project.lastAssignmentDate 
            ? formatDate(new Date(project.lastAssignmentDate))
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

    cardView.innerHTML = cardsHTML;
    cardView.style.display = 'grid';
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
                    <div class="project-info-grid">
                        <div class="info-section">
                            <h4>Project Information</h4>
                            <p><strong>Description:</strong> ${project.description || 'No description available'}</p>
                            <p><strong>Status:</strong> <span class="status-badge status-${project.status.toLowerCase().replace(' ', '-')}">${project.status}</span></p>
                            <p><strong>Location:</strong> ${project.location || 'N/A'}</p>
                            <p><strong>Budget:</strong> ${project.budget ? `$${Number(project.budget).toLocaleString()}` : 'N/A'}</p>
                        </div>

                        <div class="info-section">
                            <h4>Timeline</h4>
                            <p><strong>Start Date:</strong> ${project.start_date ? formatDate(new Date(project.start_date)) : 'N/A'}</p>
                            <p><strong>End Date:</strong> ${project.end_date ? formatDate(new Date(project.end_date)) : 'N/A'}</p>
                            <p><strong>Current Assignments:</strong> ${project.assignmentCount || 0}</p>
                        </div>
                    </div>

                    ${assignmentsHTML}

                    <div class="project-actions">
                        <button type="button" class="btn btn-secondary" onclick="viewProjectCalendar('${projectId}')">View in Calendar</button>
                        ${currentUser && currentUser.role === 'manager' ?
                            `<button type="button" class="btn btn-warning" onclick="editProject('${projectId}')">Edit Project</button>` :
                            ''
                        }
                        <button type="button" class="btn btn-primary" onclick="exportProjectReport('${projectId}')">Export Report</button>
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
 * Export projects data
 */
async function exportProjects() {
    try {
        showNotification('Exporting projects...', 'info');

        // This would integrate with the existing export functionality
        // For now, show a placeholder message
        showNotification('Project export functionality coming soon', 'info');

    } catch (error) {
        console.error('Error exporting projects:', error);
        showNotification('Failed to export projects', 'error');
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
 * Export project report
 */
async function exportProjectReport(projectId) {
    try {
        showNotification('Exporting project report...', 'info');

        // This would integrate with the existing export functionality
        // For now, show a placeholder message
        showNotification('Project report export functionality coming soon', 'info');

    } catch (error) {
        console.error('Error exporting project report:', error);
        showNotification('Failed to export project report', 'error');
    }
}

/**
 * Show create project modal
 */
function showCreateProjectModal() {
    // Check if user is a manager
    if (!currentUser || currentUser.role !== 'manager') {
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
 * Edit existing project
 */
async function editProject(projectId) {
    try {
        // Check if user is a manager
        if (!currentUser || currentUser.role !== 'manager') {
            showNotification('Only managers can edit projects', 'error');
            return;
        }

        // Find the project data
        const project = projects.find(p => p.project_id === projectId);
        if (!project) {
            showNotification('Project not found', 'error');
            return;
        }

        // Show the create modal but populate it with existing data
        showCreateProjectModal();

        // Change modal title
        const modalTitle = document.querySelector('#createProjectModal .modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Edit Project';
        }

        // Populate form with existing data
        document.getElementById('projectName').value = project.name || '';
        document.getElementById('projectId').value = project.project_id || '';
        document.getElementById('projectId').readOnly = true; // Don't allow changing project ID
        document.getElementById('projectDescription').value = project.description || '';
        document.getElementById('projectLocation').value = project.location || '';
        document.getElementById('projectStatus').value = project.status || 'Active';
        document.getElementById('projectStartDate').value = project.start_date || '';
        document.getElementById('projectEndDate').value = project.end_date || '';
        document.getElementById('projectBudget').value = project.budget || '';
        document.getElementById('projectManager').value = project.project_manager || '';
        document.getElementById('projectNotes').value = project.notes || '';

        // Change the create button to update
        const createBtn = document.querySelector('#createProjectModal .modal-footer .btn-primary');
        if (createBtn) {
            createBtn.textContent = 'Update Project';
            createBtn.onclick = () => updateProject(projectId);
        }

    } catch (error) {
        console.error('Error editing project:', error);
        showNotification('Failed to load project for editing', 'error');
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
    if (createBtn && currentUser) {
        if (currentUser.role === 'manager') {
            createBtn.style.display = 'inline-flex';
        } else {
            createBtn.style.display = 'none';
        }
    }
}
