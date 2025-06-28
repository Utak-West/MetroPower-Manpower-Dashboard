/**
 * MetroPower Manager Dashboard JavaScript
 * Handles all frontend functionality for manager data input and export
 */

const API_BASE = window.location.origin + '/api/manager';
let authToken = localStorage.getItem('accessToken');

// Tab management
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // Load data for the selected tab
    loadTabData(tabName);
}

// Load data for specific tab
async function loadTabData(tabName) {
    switch(tabName) {
        case 'employees':
            await loadEmployees();
            break;
        case 'projects':
            await loadProjects();
            break;
        case 'assignments':
            await loadAssignments();
            await loadEmployeeOptions();
            await loadProjectOptions();
            break;
    }
}

// API helper function
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API call failed: ${endpoint}`, error);
        showAlert(error.message, 'error');
        throw error;
    }
}

// Show alert messages
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Insert at the top of the current active tab
    const activeTab = document.querySelector('.tab-content.active');
    activeTab.insertBefore(alertDiv, activeTab.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Clear form
function clearForm(formId) {
    document.getElementById(formId).reset();
}

// Load employees
async function loadEmployees() {
    try {
        const data = await apiCall('/employees');
        const employeesList = document.getElementById('employeesList');
        
        if (data.employees && data.employees.length > 0) {
            const tableHTML = `
                <h3>Current Employees</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Position</th>
                            <th>Status</th>
                            <th>Phone</th>
                            <th>Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.employees.map(emp => `
                            <tr>
                                <td>${emp.employee_id}</td>
                                <td>${emp.name}</td>
                                <td>${emp.position_name || 'N/A'}</td>
                                <td><span class="status-badge status-${emp.status.toLowerCase()}">${emp.status}</span></td>
                                <td>${emp.phone || 'N/A'}</td>
                                <td>${emp.email || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            employeesList.innerHTML = tableHTML;
        } else {
            employeesList.innerHTML = '<p>No employees found.</p>';
        }
    } catch (error) {
        console.error('Failed to load employees:', error);
    }
}

// Load projects
async function loadProjects() {
    try {
        const data = await apiCall('/projects');
        const projectsList = document.getElementById('projectsList');
        
        if (data.projects && data.projects.length > 0) {
            const tableHTML = `
                <h3>Current Projects</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Number</th>
                            <th>Status</th>
                            <th>Location</th>
                            <th>Budget</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.projects.map(proj => `
                            <tr>
                                <td>${proj.project_id}</td>
                                <td>${proj.name}</td>
                                <td>${proj.number}</td>
                                <td><span class="status-badge status-${proj.status.toLowerCase().replace(' ', '-')}">${proj.status}</span></td>
                                <td>${proj.location || 'N/A'}</td>
                                <td>$${proj.budget ? Number(proj.budget).toLocaleString() : 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            projectsList.innerHTML = tableHTML;
        } else {
            projectsList.innerHTML = '<p>No projects found.</p>';
        }
    } catch (error) {
        console.error('Failed to load projects:', error);
    }
}

// Load assignments
async function loadAssignments() {
    try {
        const data = await apiCall('/assignments');
        const assignmentsList = document.getElementById('assignmentsList');
        
        if (data.assignments && data.assignments.length > 0) {
            const tableHTML = `
                <h3>Current Assignments</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Employee</th>
                            <th>Project</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.assignments.map(assign => `
                            <tr>
                                <td>${new Date(assign.assignment_date).toLocaleDateString()}</td>
                                <td>${assign.employee_name || assign.employee_id}</td>
                                <td>${assign.project_name || assign.project_id}</td>
                                <td>${assign.notes || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            assignmentsList.innerHTML = tableHTML;
        } else {
            assignmentsList.innerHTML = '<p>No assignments found.</p>';
        }
    } catch (error) {
        console.error('Failed to load assignments:', error);
    }
}

// Load employee options for assignment form
async function loadEmployeeOptions() {
    try {
        const data = await apiCall('/employees');
        const select = document.getElementById('assignEmployee');
        
        select.innerHTML = '<option value="">Select Employee</option>';
        
        if (data.employees) {
            data.employees.forEach(emp => {
                if (emp.status === 'Active') {
                    const option = document.createElement('option');
                    option.value = emp.employee_id;
                    option.textContent = `${emp.name} (${emp.employee_id})`;
                    select.appendChild(option);
                }
            });
        }
    } catch (error) {
        console.error('Failed to load employee options:', error);
    }
}

// Load project options for assignment form
async function loadProjectOptions() {
    try {
        const data = await apiCall('/projects');
        const select = document.getElementById('assignProject');
        
        select.innerHTML = '<option value="">Select Project</option>';
        
        if (data.projects) {
            data.projects.forEach(proj => {
                if (proj.status === 'Active') {
                    const option = document.createElement('option');
                    option.value = proj.project_id;
                    option.textContent = `${proj.name} (${proj.project_id})`;
                    select.appendChild(option);
                }
            });
        }
    } catch (error) {
        console.error('Failed to load project options:', error);
    }
}

// Form submission handlers
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    if (!authToken) {
        console.log('No auth token found, redirecting to main dashboard...');
        window.location.href = '/';
        return;
    }

    // Set today's date as default for assignment form
    document.getElementById('assignDate').valueAsDate = new Date();
    
    // Load initial data
    loadTabData('employees');

    // Employee form submission
    document.getElementById('employeeForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const employeeData = Object.fromEntries(formData.entries());
        
        try {
            await apiCall('/employees', {
                method: 'POST',
                body: JSON.stringify(employeeData)
            });
            
            showAlert('Employee added successfully!');
            this.reset();
            await loadEmployees();
        } catch (error) {
            console.error('Failed to add employee:', error);
        }
    });

    // Project form submission
    document.getElementById('projectForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const projectData = Object.fromEntries(formData.entries());
        
        try {
            await apiCall('/projects', {
                method: 'POST',
                body: JSON.stringify(projectData)
            });
            
            showAlert('Project added successfully!');
            this.reset();
            await loadProjects();
        } catch (error) {
            console.error('Failed to add project:', error);
        }
    });

    // Assignment form submission
    document.getElementById('assignmentForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const assignmentData = Object.fromEntries(formData.entries());
        
        try {
            await apiCall('/assignments', {
                method: 'POST',
                body: JSON.stringify(assignmentData)
            });
            
            showAlert('Assignment created successfully!');
            this.reset();
            document.getElementById('assignDate').valueAsDate = new Date();
            await loadAssignments();
        } catch (error) {
            console.error('Failed to create assignment:', error);
        }
    });
});

// Export functionality
async function exportData(type, format) {
    try {
        const response = await fetch(`${API_BASE}/export-${type}?format=${format}`);

        if (!response.ok) {
            throw new Error('Export failed');
        }

        if (format === 'csv') {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `metropower_${type}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            const data = await response.json();
            console.log('Export data:', data);
        }

        showAlert(`${type} exported successfully!`);
    } catch (error) {
        console.error('Export failed:', error);
        showAlert('Export failed. Please try again.', 'error');
    }
}
