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
        displayUserInfo(userResponse.user);

        // Load initial data
        await Promise.all([
            loadEmployees(),
            loadProjects(),
            loadAssignments()
        ]);

        // Set up form handler
        setupFormHandler();

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
    const userDisplay = document.getElementById('userDisplay');
    userDisplay.textContent = `${user.first_name} ${user.last_name} (${user.role})`;
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
        
        displayAssignments(assignments);
        
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
            
        const statusClass = `status-${assignment.status.toLowerCase()}`;
        
        row.innerHTML = `
            <td>${formatDate(assignment.date)}</td>
            <td>${employeeName}</td>
            <td>${projectName}</td>
            <td>${assignment.task_description || 'No description'}</td>
            <td>${assignment.location || 'No location'}</td>
            <td><span class="status-badge ${statusClass}">${assignment.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-danger" onclick="deleteAssignment(${assignment.assignment_id})">Delete</button>
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
 * Create new assignment
 */
async function createAssignment() {
    const formData = {
        employee_id: parseInt(document.getElementById('employee_id').value),
        project_id: parseInt(document.getElementById('project_id').value),
        assignment_date: document.getElementById('assignment_date').value,
        task_description: document.getElementById('task_description').value,
        location: document.getElementById('location').value,
        notes: document.getElementById('notes').value
    };
    
    try {
        clearMessages();
        
        const response = await api.post('/assignments', formData);
        
        showSuccess('Assignment created successfully!');
        
        // Reset form
        document.getElementById('assignmentForm').reset();
        document.getElementById('assignment_date').value = new Date().toISOString().split('T')[0];
        
        // Refresh assignments list
        await loadAssignments();
        
    } catch (error) {
        console.error('Failed to create assignment:', error);
        showError('Failed to create assignment: ' + error.message);
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
        
        if (format === 'csv') {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `assignments_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showSuccess('Assignments exported successfully!');
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
 * Logout user
 */
function logout() {
    api.setToken(null);
    window.location.href = '/';
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
