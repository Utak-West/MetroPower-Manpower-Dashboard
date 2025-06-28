/**
 * Assignment Management JavaScript
 * 
 * Handles assignment CRUD operations, form management, and data display
 * for the MetroPower Dashboard MVP.
 */

// Global variables
let employees = [];
let projects = [];
let assignments = [];
let currentUser = null;
let filteredAssignments = [];

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Assignment Manager initializing...');
    
    // Check authentication
    if (!api.isAuthenticated()) {
        window.location.href = '/';
        return;
    }

    // Initialize the page
    await initializePage();
});

/**
 * Initialize the assignment management page
 */
async function initializePage() {
    try {
        // Verify authentication and get user info
        const userResponse = await api.verifyToken();
        currentUser = userResponse.user;
        displayUserInfo(currentUser);

        // Load initial data
        await Promise.all([
            loadEmployees(),
            loadProjects(),
            loadAssignments()
        ]);

        // Set up form handlers
        setupFormHandler();
        setupEditFormHandler();
        setupFilterHandlers();

        // Initialize mobile navigation
        initializeMobileNavigation();

        // Set default date to today
        document.getElementById('assignment_date').value = new Date().toISOString().split('T')[0];

    } catch (error) {
        console.error('Failed to initialize page:', error);
        showError('Failed to load page data. Please refresh and try again.');
    }
}

/**
 * Display user information in header
 */
function displayUserInfo(user) {
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
}

/**
 * Load employees and populate dropdown
 */
async function loadEmployees() {
    try {
        const response = await api.getEmployees();
        employees = response.data || [];
        
        const employeeSelect = document.getElementById('employee_id');
        employeeSelect.innerHTML = '<option value="">Select Employee</option>';
        
        employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.employee_id;
            option.textContent = `${employee.first_name} ${employee.last_name} - ${employee.position}`;
            employeeSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load employees:', error);
        showError('Failed to load employees');
    }
}

/**
 * Load projects and populate dropdown
 */
async function loadProjects() {
    try {
        const response = await api.getProjects();
        projects = response.data || [];
        
        const projectSelect = document.getElementById('project_id');
        projectSelect.innerHTML = '<option value="">Select Project</option>';
        
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.project_id;
            option.textContent = `${project.name} - ${project.location}`;
            projectSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load projects:', error);
        showError('Failed to load projects');
    }
}

/**
 * Load assignments and display in table
 */
async function loadAssignments() {
    const loadingEl = document.getElementById('assignmentsLoading');
    const errorEl = document.getElementById('assignmentsError');
    const tableEl = document.getElementById('assignmentsTable');
    
    try {
        loadingEl.classList.remove('hidden');
        errorEl.classList.add('hidden');
        tableEl.classList.add('hidden');

        const response = await api.get('/assignments');
        assignments = response.data || [];
        filteredAssignments = [...assignments];

        // Populate filter dropdowns
        populateAssignmentFilters();

        displayAssignments(filteredAssignments);

        loadingEl.classList.add('hidden');
        tableEl.classList.remove('hidden');
    } catch (error) {
        console.error('Failed to load assignments:', error);
        loadingEl.classList.add('hidden');
        errorEl.textContent = 'Failed to load assignments: ' + error.message;
        errorEl.classList.remove('hidden');
    }
}

/**
 * Display assignments in the table
 */
function displayAssignments(assignmentList) {
    const tbody = document.getElementById('assignmentsBody');
    tbody.innerHTML = '';
    
    if (assignmentList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #6c757d;">No assignments found</td></tr>';
        return;
    }
    
    assignmentList.forEach(assignment => {
        const row = document.createElement('tr');
        
        const employeeName = assignment.employee ? 
            `${assignment.employee.first_name} ${assignment.employee.last_name}` : 
            'Unknown Employee';
            
        const projectName = assignment.project ? 
            assignment.project.name : 
            'Unknown Project';
            
        // Use assignment_date for database mode, date for demo mode
        const assignmentDate = assignment.assignment_date || assignment.date;
        const statusClass = assignment.status ? `status-${assignment.status.toLowerCase()}` : '';

        // Check if user can edit/delete (managers and admins)
        const canEdit = currentUser && ['Project Manager', 'Admin', 'Super Admin'].includes(currentUser.role);

        row.innerHTML = `
            <td>${formatDate(assignmentDate)}</td>
            <td>${employeeName}</td>
            <td>${projectName}</td>
            <td>${assignment.task_description || assignment.notes || 'No description'}</td>
            <td>${assignment.location || 'No location'}</td>
            <td>${assignment.status ? `<span class="status-badge ${statusClass}">${assignment.status}</span>` : 'Active'}</td>
            <td>
                <div class="action-buttons">
                    ${canEdit ? `<button type="button" class="btn btn-sm btn-primary" onclick="editAssignment(${assignment.assignment_id})">Edit</button>` : ''}
                    ${canEdit ? `<button type="button" class="btn btn-sm btn-danger" onclick="deleteAssignment(${assignment.assignment_id})">Delete</button>` : ''}
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * Set up form submission handler
 */
function setupFormHandler() {
    const form = document.getElementById('assignmentForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await createAssignment();
    });
}

/**
 * Set up edit form submission handler
 */
function setupEditFormHandler() {
    const editForm = document.getElementById('editAssignmentForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateAssignment();
        });
    }
}

/**
 * Set up filter event handlers
 */
function setupFilterHandlers() {
    // Project filter
    const projectFilter = document.getElementById('assignmentProjectFilter');
    if (projectFilter) {
        projectFilter.addEventListener('change', applyAssignmentFilters);
    }

    // Employee filter
    const employeeFilter = document.getElementById('assignmentEmployeeFilter');
    if (employeeFilter) {
        employeeFilter.addEventListener('change', applyAssignmentFilters);
    }

    // Status filter
    const statusFilter = document.getElementById('assignmentStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyAssignmentFilters);
    }

    // Date filters
    const dateFromFilter = document.getElementById('assignmentDateFrom');
    if (dateFromFilter) {
        dateFromFilter.addEventListener('change', applyAssignmentFilters);
    }

    const dateToFilter = document.getElementById('assignmentDateTo');
    if (dateToFilter) {
        dateToFilter.addEventListener('change', applyAssignmentFilters);
    }

    // Sort filters
    const sortByFilter = document.getElementById('assignmentSortBy');
    if (sortByFilter) {
        sortByFilter.addEventListener('change', applyAssignmentSorting);
    }

    const sortOrderFilter = document.getElementById('assignmentSortOrder');
    if (sortOrderFilter) {
        sortOrderFilter.addEventListener('change', applyAssignmentSorting);
    }

    // Clear filters button
    const clearFiltersBtn = document.getElementById('clearAssignmentFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAssignmentFilters);
    }
}

/**
 * Create new assignment
 */
async function createAssignment() {
    const formData = {
        employee_id: parseInt(document.getElementById('employee_id').value),
        project_id: parseInt(document.getElementById('project_id').value),
        assignment_date: document.getElementById('assignment_date').value,
        task_description: document.getElementById('task_description').value.trim(),
        location: document.getElementById('location').value.trim(),
        notes: document.getElementById('notes').value.trim()
    };

    try {
        clearMessages();

        // Validate form data
        const validationErrors = validateAssignmentData(formData, false);
        if (validationErrors.length > 0) {
            showError('Validation errors: ' + validationErrors.join(', '));
            return;
        }

        const response = await api.post('/assignments', formData);

        showSuccess('Assignment created successfully!');

        // Reset form
        document.getElementById('assignmentForm').reset();
        document.getElementById('assignment_date').value = new Date().toISOString().split('T')[0];

        // Refresh assignments list
        await loadAssignments();

    } catch (error) {
        console.error('Failed to create assignment:', error);

        // Handle specific error types
        if (error.message.includes('already assigned')) {
            showError('Conflict: Employee is already assigned to another project on this date');
        } else if (error.message.includes('Validation error')) {
            showError('Validation error: ' + error.message);
        } else {
            showError('Failed to create assignment: ' + error.message);
        }
    }
}

/**
 * Edit assignment
 */
async function editAssignment(assignmentId) {
    try {
        // Get assignment data
        const response = await api.get(`/assignments/${assignmentId}`);
        const assignment = response.data;

        // Populate edit form
        document.getElementById('edit_assignment_id').value = assignment.assignment_id;
        document.getElementById('edit_employee_id').value = assignment.employee_id;
        document.getElementById('edit_project_id').value = assignment.project_id;
        document.getElementById('edit_assignment_date').value = assignment.assignment_date || assignment.date;
        document.getElementById('edit_location').value = assignment.location || '';
        document.getElementById('edit_task_description').value = assignment.task_description || assignment.notes || '';
        document.getElementById('edit_notes').value = assignment.notes || '';

        // Populate dropdowns if not already populated
        if (employees.length === 0) await loadEmployees();
        if (projects.length === 0) await loadProjects();

        // Populate edit form dropdowns
        populateEditDropdowns();

        // Show modal
        document.getElementById('editAssignmentModal').classList.remove('hidden');

    } catch (error) {
        console.error('Failed to load assignment for editing:', error);
        showError('Failed to load assignment data: ' + error.message);
    }
}

/**
 * Populate edit form dropdowns
 */
function populateEditDropdowns() {
    // Populate employees dropdown
    const employeeSelect = document.getElementById('edit_employee_id');
    const currentEmployeeValue = employeeSelect.value;
    employeeSelect.innerHTML = '<option value="">Select Employee</option>';

    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.employee_id;
        option.textContent = `${employee.first_name || employee.name} ${employee.last_name || ''} - ${employee.position}`;
        if (employee.employee_id == currentEmployeeValue) {
            option.selected = true;
        }
        employeeSelect.appendChild(option);
    });

    // Populate projects dropdown
    const projectSelect = document.getElementById('edit_project_id');
    const currentProjectValue = projectSelect.value;
    projectSelect.innerHTML = '<option value="">Select Project</option>';

    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.project_id;
        option.textContent = project.name;
        if (project.project_id == currentProjectValue) {
            option.selected = true;
        }
        projectSelect.appendChild(option);
    });
}

/**
 * Close edit modal
 */
function closeEditModal() {
    document.getElementById('editAssignmentModal').classList.add('hidden');
    clearEditMessages();
}

/**
 * Validate assignment form data
 */
function validateAssignmentData(formData, isEdit = false) {
    const errors = [];

    // Required field validation
    if (!formData.employee_id) {
        errors.push('Employee is required');
    }

    if (!formData.project_id) {
        errors.push('Project is required');
    }

    if (!formData.assignment_date) {
        errors.push('Assignment date is required');
    }

    // Date validation
    if (formData.assignment_date) {
        const assignmentDate = new Date(formData.assignment_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(assignmentDate.getTime())) {
            errors.push('Invalid assignment date format');
        } else {
            // Check if date is too far in the past (more than 1 year)
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            if (assignmentDate < oneYearAgo) {
                errors.push('Assignment date cannot be more than 1 year in the past');
            }

            // Check if date is too far in the future (more than 1 year)
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

            if (assignmentDate > oneYearFromNow) {
                errors.push('Assignment date cannot be more than 1 year in the future');
            }
        }
    }

    // Text field length validation
    if (formData.location && formData.location.length > 255) {
        errors.push('Location must be less than 255 characters');
    }

    if (formData.task_description && formData.task_description.length > 1000) {
        errors.push('Task description must be less than 1000 characters');
    }

    if (formData.notes && formData.notes.length > 1000) {
        errors.push('Notes must be less than 1000 characters');
    }

    return errors;
}

/**
 * Update assignment
 */
async function updateAssignment() {
    const assignmentId = document.getElementById('edit_assignment_id').value;
    const formData = {
        employee_id: parseInt(document.getElementById('edit_employee_id').value),
        project_id: parseInt(document.getElementById('edit_project_id').value),
        assignment_date: document.getElementById('edit_assignment_date').value,
        location: document.getElementById('edit_location').value.trim(),
        task_description: document.getElementById('edit_task_description').value.trim(),
        notes: document.getElementById('edit_notes').value.trim()
    };

    try {
        clearEditMessages();

        // Validate form data
        const validationErrors = validateAssignmentData(formData, true);
        if (validationErrors.length > 0) {
            showEditError('Validation errors: ' + validationErrors.join(', '));
            return;
        }

        const response = await api.put(`/assignments/${assignmentId}`, formData);

        showEditSuccess('Assignment updated successfully!');

        // Refresh assignments list
        await loadAssignments();

        // Close modal after a short delay
        setTimeout(() => {
            closeEditModal();
        }, 1500);

    } catch (error) {
        console.error('Failed to update assignment:', error);

        // Handle specific error types
        if (error.message.includes('already assigned')) {
            showEditError('Conflict: Employee is already assigned to another project on this date');
        } else if (error.message.includes('not found')) {
            showEditError('Assignment not found. It may have been deleted by another user.');
        } else if (error.message.includes('Validation error')) {
            showEditError('Validation error: ' + error.message);
        } else {
            showEditError('Failed to update assignment: ' + error.message);
        }
    }
}

/**
 * Delete assignment
 */
async function deleteAssignment(assignmentId) {
    if (!confirm('Are you sure you want to delete this assignment?')) {
        return;
    }

    try {
        await api.delete(`/assignments/${assignmentId}`);
        showSuccess('Assignment deleted successfully!');
        await loadAssignments();
    } catch (error) {
        console.error('Failed to delete assignment:', error);
        showError('Failed to delete assignment: ' + error.message);
    }
}

/**
 * Refresh assignments list
 */
async function refreshAssignments() {
    await loadAssignments();
}

/**
 * Export assignments data
 */
async function exportAssignments(format) {
    try {
        const response = await fetch(`${api.baseURL}/exports/assignments?format=${format}`, {
            headers: api.getHeaders()
        });

        if (!response.ok) {
            throw new Error('Export failed');
        }

        if (format === 'csv' || format === 'excel' || format === 'pdf') {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            let fileExtension = format;
            if (format === 'excel') fileExtension = 'xlsx';

            a.download = `assignments_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showSuccess(`Assignments exported as ${format.toUpperCase()} successfully!`);
        } else {
            const data = await response.json();
            console.log('Export data:', data);
            showSuccess('Export completed!');
        }
    } catch (error) {
        console.error('Export failed:', error);
        showError('Export failed: ' + error.message);
    }
}

/**
 * Show success message in edit modal
 */
function showEditSuccess(message) {
    const messageEl = document.getElementById('editFormMessage');
    messageEl.innerHTML = `<div class="success">${message}</div>`;
}

/**
 * Show error message in edit modal
 */
function showEditError(message) {
    const messageEl = document.getElementById('editFormMessage');
    messageEl.innerHTML = `<div class="error">${message}</div>`;
}

/**
 * Clear edit modal messages
 */
function clearEditMessages() {
    const messageEl = document.getElementById('editFormMessage');
    messageEl.innerHTML = '';
}

/**
 * Logout user
 */
function logout() {
    api.setToken(null);
    window.location.href = '/';
}

/**
 * Populate assignment filter dropdowns
 */
function populateAssignmentFilters() {
    // Populate project filter
    const projectFilter = document.getElementById('assignmentProjectFilter');
    if (projectFilter && projects.length > 0) {
        projectFilter.innerHTML = '<option value="">All Projects</option>';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.project_id;
            option.textContent = project.name || project.project_name;
            projectFilter.appendChild(option);
        });
    }

    // Populate employee filter
    const employeeFilter = document.getElementById('assignmentEmployeeFilter');
    if (employeeFilter && employees.length > 0) {
        employeeFilter.innerHTML = '<option value="">All Employees</option>';
        employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.employee_id;
            option.textContent = employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
            employeeFilter.appendChild(option);
        });
    }
}

/**
 * Apply assignment filters
 */
function applyAssignmentFilters() {
    const projectFilter = document.getElementById('assignmentProjectFilter')?.value || '';
    const employeeFilter = document.getElementById('assignmentEmployeeFilter')?.value || '';
    const statusFilter = document.getElementById('assignmentStatusFilter')?.value || '';
    const dateFromFilter = document.getElementById('assignmentDateFrom')?.value || '';
    const dateToFilter = document.getElementById('assignmentDateTo')?.value || '';

    filteredAssignments = assignments.filter(assignment => {
        // Project filter
        if (projectFilter && assignment.project_id != projectFilter) {
            return false;
        }

        // Employee filter
        if (employeeFilter && assignment.employee_id != employeeFilter) {
            return false;
        }

        // Status filter
        if (statusFilter && (assignment.status || 'Assigned') !== statusFilter) {
            return false;
        }

        // Date range filter
        const assignmentDate = assignment.assignment_date || assignment.date;
        if (assignmentDate) {
            const date = new Date(assignmentDate);

            if (dateFromFilter) {
                const fromDate = new Date(dateFromFilter);
                if (date < fromDate) return false;
            }

            if (dateToFilter) {
                const toDate = new Date(dateToFilter);
                if (date > toDate) return false;
            }
        }

        return true;
    });

    applyAssignmentSorting();
    displayAssignments(filteredAssignments);
}

/**
 * Clear assignment filters
 */
function clearAssignmentFilters() {
    document.getElementById('assignmentProjectFilter').value = '';
    document.getElementById('assignmentEmployeeFilter').value = '';
    document.getElementById('assignmentStatusFilter').value = '';
    document.getElementById('assignmentDateFrom').value = '';
    document.getElementById('assignmentDateTo').value = '';
    document.getElementById('assignmentSortBy').value = 'date';
    document.getElementById('assignmentSortOrder').value = 'desc';

    filteredAssignments = [...assignments];
    applyAssignmentSorting();
    displayAssignments(filteredAssignments);
}

/**
 * Apply sorting to assignment data
 */
function applyAssignmentSorting() {
    const sortBy = document.getElementById('assignmentSortBy')?.value || 'date';
    const sortOrder = document.getElementById('assignmentSortOrder')?.value || 'desc';

    filteredAssignments.sort((a, b) => {
        let aValue, bValue;

        switch (sortBy) {
            case 'date':
                aValue = new Date(a.assignment_date || a.date || '1970-01-01');
                bValue = new Date(b.assignment_date || b.date || '1970-01-01');
                break;
            case 'employee':
                const aEmployee = employees.find(emp => emp.employee_id == a.employee_id);
                const bEmployee = employees.find(emp => emp.employee_id == b.employee_id);
                aValue = aEmployee ? (aEmployee.name || `${aEmployee.first_name || ''} ${aEmployee.last_name || ''}`.trim()) : '';
                bValue = bEmployee ? (bEmployee.name || `${bEmployee.first_name || ''} ${bEmployee.last_name || ''}`.trim()) : '';
                break;
            case 'project':
                const aProject = projects.find(proj => proj.project_id == a.project_id);
                const bProject = projects.find(proj => proj.project_id == b.project_id);
                aValue = aProject ? (aProject.name || aProject.project_name || '') : '';
                bValue = bProject ? (bProject.name || bProject.project_name || '') : '';
                break;
            case 'status':
                aValue = a.status || 'Assigned';
                bValue = b.status || 'Assigned';
                break;
            default:
                aValue = a.assignment_date || a.date || '';
                bValue = b.assignment_date || b.date || '';
        }

        // Handle date comparison
        if (sortBy === 'date') {
            if (sortOrder === 'desc') {
                return bValue - aValue;
            } else {
                return aValue - bValue;
            }
        }

        // Handle string comparison
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();

        if (sortOrder === 'desc') {
            return bValue.localeCompare(aValue);
        } else {
            return aValue.localeCompare(bValue);
        }
    });

    displayAssignments(filteredAssignments);
}

/**
 * Utility functions
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function showError(message) {
    const messageEl = document.getElementById('formMessage');
    messageEl.innerHTML = `<div class="error">${message}</div>`;
}

function showSuccess(message) {
    const messageEl = document.getElementById('formMessage');
    messageEl.innerHTML = `<div class="success">${message}</div>`;
}

function clearMessages() {
    const messageEl = document.getElementById('formMessage');
    messageEl.innerHTML = '';
}
