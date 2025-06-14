/**
 * Standalone MetroPower Manager Dashboard
 * All functionality runs in the browser with localStorage
 */

// Local data storage using localStorage
let data = {
    employees: [],
    projects: [],
    assignments: []
};

// Initialize with sample data
function initializeData() {
    // Check if data exists in localStorage
    const savedEmployees = localStorage.getItem('metropower_employees');
    const savedProjects = localStorage.getItem('metropower_projects');
    const savedAssignments = localStorage.getItem('metropower_assignments');

    if (savedEmployees) {
        data.employees = JSON.parse(savedEmployees);
    } else {
        // Initialize with sample employees
        data.employees = [
            {
                employee_id: 'EMP001',
                name: 'John Smith',
                position: 'Electrician',
                status: 'Active',
                employee_number: '12345',
                phone: '555-0101',
                email: 'john.smith@metropower.com',
                notes: 'Experienced electrician'
            },
            {
                employee_id: 'EMP002',
                name: 'Mike Johnson',
                position: 'Field Supervisor',
                status: 'Active',
                employee_number: '12346',
                phone: '555-0102',
                email: 'mike.johnson@metropower.com',
                notes: 'Field supervisor with 10 years experience'
            },
            {
                employee_id: 'EMP003',
                name: 'Sarah Davis',
                position: 'Apprentice',
                status: 'Active',
                employee_number: '12347',
                phone: '555-0103',
                email: 'sarah.davis@metropower.com',
                notes: 'Second year apprentice'
            }
        ];
        saveData();
    }

    if (savedProjects) {
        data.projects = JSON.parse(savedProjects);
    } else {
        // Initialize with sample projects
        data.projects = [
            {
                project_id: 'PROJ-001',
                name: 'Downtown Office Building',
                number: 'TB-2025-001',
                status: 'Active',
                start_date: '2025-01-01',
                end_date: '2025-06-30',
                location: '123 Main St, Atlanta, GA',
                description: 'Electrical installation for new office building',
                budget: 250000
            },
            {
                project_id: 'PROJ-002',
                name: 'Warehouse Renovation',
                number: 'TB-2025-002',
                status: 'Active',
                start_date: '2025-02-01',
                end_date: '2025-08-15',
                location: '456 Industrial Blvd, Atlanta, GA',
                description: 'Complete electrical system upgrade',
                budget: 180000
            }
        ];
        saveData();
    }

    if (savedAssignments) {
        data.assignments = JSON.parse(savedAssignments);
    } else {
        // Initialize with sample assignments
        data.assignments = [
            {
                assignment_id: 1,
                employee_id: 'EMP001',
                project_id: 'PROJ-001',
                assignment_date: '2025-06-14',
                notes: 'Working on main electrical panel installation'
            },
            {
                assignment_id: 2,
                employee_id: 'EMP002',
                project_id: 'PROJ-001',
                assignment_date: '2025-06-14',
                notes: 'Supervising electrical team'
            }
        ];
        saveData();
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('metropower_employees', JSON.stringify(data.employees));
    localStorage.setItem('metropower_projects', JSON.stringify(data.projects));
    localStorage.setItem('metropower_assignments', JSON.stringify(data.assignments));
}

// Authentication
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Simple authentication check
    if ((email === 'antione.harrell@metropower.com' && password === 'password123') ||
        (email === 'admin@metropower.com' && password === 'MetroPower2025!')) {
        
        document.getElementById('loginOverlay').style.display = 'none';
        showAlert('Welcome to MetroPower Manager Dashboard!', 'success');
        loadTabData('employees');
    } else {
        showAlert('Invalid credentials. Please try again.', 'error');
    }
}

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
function loadTabData(tabName) {
    switch(tabName) {
        case 'employees':
            loadEmployees();
            break;
        case 'projects':
            loadProjects();
            break;
        case 'assignments':
            loadAssignments();
            loadEmployeeOptions();
            loadProjectOptions();
            break;
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
    if (formId === 'assignmentForm') {
        document.getElementById('assignDate').valueAsDate = new Date();
    }
}

// Load employees
function loadEmployees() {
    const employeesList = document.getElementById('employeesList');
    
    if (data.employees.length > 0) {
        const tableHTML = `
            <h3>Current Employees (${data.employees.length})</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Status</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.employees.map(emp => `
                        <tr>
                            <td>${emp.employee_id}</td>
                            <td>${emp.name}</td>
                            <td>${emp.position}</td>
                            <td><span class="status-badge status-${emp.status.toLowerCase()}">${emp.status}</span></td>
                            <td>${emp.phone || 'N/A'}</td>
                            <td>${emp.email || 'N/A'}</td>
                            <td><button class="btn btn-secondary" onclick="deleteEmployee('${emp.employee_id}')">Delete</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        employeesList.innerHTML = tableHTML;
    } else {
        employeesList.innerHTML = '<p>No employees found. Add some employees using the form above.</p>';
    }
}

// Load projects
function loadProjects() {
    const projectsList = document.getElementById('projectsList');
    
    if (data.projects.length > 0) {
        const tableHTML = `
            <h3>Current Projects (${data.projects.length})</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Number</th>
                        <th>Status</th>
                        <th>Location</th>
                        <th>Budget</th>
                        <th>Actions</th>
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
                            <td><button class="btn btn-secondary" onclick="deleteProject('${proj.project_id}')">Delete</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        projectsList.innerHTML = tableHTML;
    } else {
        projectsList.innerHTML = '<p>No projects found. Add some projects using the form above.</p>';
    }
}

// Load assignments
function loadAssignments() {
    const assignmentsList = document.getElementById('assignmentsList');
    
    if (data.assignments.length > 0) {
        const tableHTML = `
            <h3>Current Assignments (${data.assignments.length})</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Employee</th>
                        <th>Project</th>
                        <th>Notes</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.assignments.map(assign => {
                        const employee = data.employees.find(e => e.employee_id === assign.employee_id);
                        const project = data.projects.find(p => p.project_id === assign.project_id);
                        return `
                            <tr>
                                <td>${new Date(assign.assignment_date).toLocaleDateString()}</td>
                                <td>${employee ? employee.name : assign.employee_id}</td>
                                <td>${project ? project.name : assign.project_id}</td>
                                <td>${assign.notes || 'N/A'}</td>
                                <td><button class="btn btn-secondary" onclick="deleteAssignment(${assign.assignment_id})">Delete</button></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        assignmentsList.innerHTML = tableHTML;
    } else {
        assignmentsList.innerHTML = '<p>No assignments found. Create some assignments using the form above.</p>';
    }
}

// Load employee options for assignment form
function loadEmployeeOptions() {
    const select = document.getElementById('assignEmployee');
    select.innerHTML = '<option value="">Select Employee</option>';
    
    data.employees.forEach(emp => {
        if (emp.status === 'Active') {
            const option = document.createElement('option');
            option.value = emp.employee_id;
            option.textContent = `${emp.name} (${emp.employee_id})`;
            select.appendChild(option);
        }
    });
}

// Load project options for assignment form
function loadProjectOptions() {
    const select = document.getElementById('assignProject');
    select.innerHTML = '<option value="">Select Project</option>';
    
    data.projects.forEach(proj => {
        if (proj.status === 'Active') {
            const option = document.createElement('option');
            option.value = proj.project_id;
            option.textContent = `${proj.name} (${proj.project_id})`;
            select.appendChild(option);
        }
    });
}

// Delete functions
function deleteEmployee(employeeId) {
    if (confirm('Are you sure you want to delete this employee?')) {
        data.employees = data.employees.filter(emp => emp.employee_id !== employeeId);
        saveData();
        loadEmployees();
        showAlert('Employee deleted successfully!');
    }
}

function deleteProject(projectId) {
    if (confirm('Are you sure you want to delete this project?')) {
        data.projects = data.projects.filter(proj => proj.project_id !== projectId);
        saveData();
        loadProjects();
        showAlert('Project deleted successfully!');
    }
}

function deleteAssignment(assignmentId) {
    if (confirm('Are you sure you want to delete this assignment?')) {
        data.assignments = data.assignments.filter(assign => assign.assignment_id !== assignmentId);
        saveData();
        loadAssignments();
        showAlert('Assignment deleted successfully!');
    }
}

// Form submission handlers
function handleEmployeeSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const employee = Object.fromEntries(formData.entries());

    // Check if employee ID already exists
    if (data.employees.find(emp => emp.employee_id === employee.employee_id)) {
        showAlert('Employee ID already exists!', 'error');
        return;
    }

    data.employees.push(employee);
    saveData();
    loadEmployees();
    clearForm('employeeForm');
    showAlert('Employee added successfully!');
}

function handleProjectSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const project = Object.fromEntries(formData.entries());

    // Check if project ID already exists
    if (data.projects.find(proj => proj.project_id === project.project_id)) {
        showAlert('Project ID already exists!', 'error');
        return;
    }

    data.projects.push(project);
    saveData();
    loadProjects();
    clearForm('projectForm');
    showAlert('Project added successfully!');
}

function handleAssignmentSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const assignment = Object.fromEntries(formData.entries());

    // Generate unique assignment ID
    assignment.assignment_id = Date.now();

    data.assignments.push(assignment);
    saveData();
    loadAssignments();
    clearForm('assignmentForm');
    showAlert('Assignment created successfully!');
}

// Export functionality
function exportData(type) {
    let csvContent = '';
    let filename = '';

    switch(type) {
        case 'employees':
            csvContent = generateEmployeeCSV();
            filename = 'metropower_employees.csv';
            break;
        case 'projects':
            csvContent = generateProjectCSV();
            filename = 'metropower_projects.csv';
            break;
        case 'assignments':
            csvContent = generateAssignmentCSV();
            filename = 'metropower_assignments.csv';
            break;
        case 'all':
            csvContent = generateAllDataCSV();
            filename = 'metropower_all_data.csv';
            break;
    }

    downloadCSV(csvContent, filename);
    showAlert(`${filename} downloaded successfully!`);
}

function generateEmployeeCSV() {
    const headers = ['Employee ID', 'Name', 'Position', 'Status', 'Employee Number', 'Phone', 'Email', 'Notes'];
    const rows = data.employees.map(emp => [
        emp.employee_id,
        emp.name,
        emp.position,
        emp.status,
        emp.employee_number || '',
        emp.phone || '',
        emp.email || '',
        emp.notes || ''
    ]);

    return [headers, ...rows].map(row =>
        row.map(field => `"${field}"`).join(',')
    ).join('\n');
}

function generateProjectCSV() {
    const headers = ['Project ID', 'Name', 'Number', 'Status', 'Start Date', 'End Date', 'Location', 'Description', 'Budget'];
    const rows = data.projects.map(proj => [
        proj.project_id,
        proj.name,
        proj.number,
        proj.status,
        proj.start_date || '',
        proj.end_date || '',
        proj.location || '',
        proj.description || '',
        proj.budget || ''
    ]);

    return [headers, ...rows].map(row =>
        row.map(field => `"${field}"`).join(',')
    ).join('\n');
}

function generateAssignmentCSV() {
    const headers = ['Assignment Date', 'Employee ID', 'Employee Name', 'Project ID', 'Project Name', 'Notes'];
    const rows = data.assignments.map(assign => {
        const employee = data.employees.find(e => e.employee_id === assign.employee_id);
        const project = data.projects.find(p => p.project_id === assign.project_id);
        return [
            assign.assignment_date,
            assign.employee_id,
            employee ? employee.name : '',
            assign.project_id,
            project ? project.name : '',
            assign.notes || ''
        ];
    });

    return [headers, ...rows].map(row =>
        row.map(field => `"${field}"`).join(',')
    ).join('\n');
}

function generateAllDataCSV() {
    let csvContent = 'METROPOWER DASHBOARD - COMPLETE DATA EXPORT\n';
    csvContent += `Export Date: ${new Date().toLocaleString()}\n\n`;

    csvContent += 'EMPLOYEES\n';
    csvContent += generateEmployeeCSV() + '\n\n';

    csvContent += 'PROJECTS\n';
    csvContent += generateProjectCSV() + '\n\n';

    csvContent += 'ASSIGNMENTS\n';
    csvContent += generateAssignmentCSV() + '\n';

    return csvContent;
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeData();

    // Set up event listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('employeeForm').addEventListener('submit', handleEmployeeSubmit);
    document.getElementById('projectForm').addEventListener('submit', handleProjectSubmit);
    document.getElementById('assignmentForm').addEventListener('submit', handleAssignmentSubmit);

    // Set today's date as default for assignment form
    document.getElementById('assignDate').valueAsDate = new Date();

    // Load initial data
    loadTabData('employees');
});
