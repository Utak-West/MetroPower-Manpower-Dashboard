/**
 * Simple Manager API - Standalone serverless function
 * Handles all manager functionality without complex dependencies
 */

// Simple in-memory data store
let data = {
    employees: [
        {
            employee_id: 'EMP001',
            name: 'John Smith',
            position: 'Electrician',
            status: 'Active',
            employee_number: '12345',
            hire_date: '2024-01-15',
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
            hire_date: '2023-08-20',
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
            hire_date: '2024-03-01',
            phone: '555-0103',
            email: 'sarah.davis@metropower.com',
            notes: 'Second year apprentice'
        },
        {
            employee_id: 'EMP004',
            name: 'Robert Wilson',
            position: 'Electrician',
            status: 'PTO',
            employee_number: '12348',
            hire_date: '2023-11-10',
            phone: '555-0104',
            email: 'robert.wilson@metropower.com',
            notes: 'On vacation until next week'
        },
        {
            employee_id: 'EMP005',
            name: 'Lisa Brown',
            position: 'General Laborer',
            status: 'Active',
            employee_number: '12349',
            hire_date: '2024-02-14',
            phone: '555-0105',
            email: 'lisa.brown@metropower.com',
            notes: 'General laborer, reliable worker'
        }
    ],
    projects: [
        {
            project_id: 'PROJ-001',
            name: 'Downtown Office Building',
            number: 'TB-2025-001',
            status: 'Active',
            start_date: '2025-01-01',
            end_date: '2025-06-30',
            location: '123 Main St, Atlanta, GA',
            description: 'Electrical installation for new office building',
            budget: 250000.00
        },
        {
            project_id: 'PROJ-002',
            name: 'Warehouse Renovation',
            number: 'TB-2025-002',
            status: 'Active',
            start_date: '2025-02-01',
            end_date: '2025-08-15',
            location: '456 Industrial Blvd, Atlanta, GA',
            description: 'Complete electrical system upgrade for warehouse facility',
            budget: 180000.00
        },
        {
            project_id: 'PROJ-003',
            name: 'Retail Store Chain',
            number: 'TB-2025-003',
            status: 'Active',
            start_date: '2025-03-01',
            end_date: '2025-09-30',
            location: 'Multiple locations, Atlanta Metro',
            description: 'Electrical work for 5 new retail store locations',
            budget: 320000.00
        }
    ],
    assignments: [
        {
            assignment_id: 1,
            employee_id: 'EMP001',
            employee_name: 'John Smith',
            project_id: 'PROJ-001',
            project_name: 'Downtown Office Building',
            assignment_date: '2025-06-14',
            notes: 'Working on main electrical panel installation'
        },
        {
            assignment_id: 2,
            employee_id: 'EMP002',
            employee_name: 'Mike Johnson',
            project_id: 'PROJ-001',
            project_name: 'Downtown Office Building',
            assignment_date: '2025-06-14',
            notes: 'Supervising electrical team'
        },
        {
            assignment_id: 3,
            employee_id: 'EMP003',
            employee_name: 'Sarah Davis',
            project_id: 'PROJ-002',
            project_name: 'Warehouse Renovation',
            assignment_date: '2025-06-14',
            notes: 'Assisting with conduit installation'
        },
        {
            assignment_id: 4,
            employee_id: 'EMP005',
            employee_name: 'Lisa Brown',
            project_id: 'PROJ-002',
            project_name: 'Warehouse Renovation',
            assignment_date: '2025-06-14',
            notes: 'Material handling and site cleanup'
        }
    ]
};

module.exports = (req, res) => {
    try {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        const { url, method } = req;
        const urlParts = url.split('/').filter(part => part);
        const endpoint = urlParts[urlParts.length - 1];

        console.log('Manager API called:', { method, url, endpoint });

        // Handle different endpoints
        if (method === 'GET') {
            if (endpoint === 'employees') {
                res.json({ success: true, employees: data.employees });
            } else if (endpoint === 'projects') {
                res.json({ success: true, projects: data.projects });
            } else if (endpoint === 'assignments') {
                res.json({ success: true, assignments: data.assignments });
            } else if (endpoint.startsWith('export-')) {
                handleExport(req, res, endpoint);
            } else {
                res.status(404).json({ error: 'Endpoint not found' });
            }
        } else if (method === 'POST') {
            if (endpoint === 'employees') {
                handleAddEmployee(req, res);
            } else if (endpoint === 'projects') {
                handleAddProject(req, res);
            } else if (endpoint === 'assignments') {
                handleAddAssignment(req, res);
            } else {
                res.status(404).json({ error: 'Endpoint not found' });
            }
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Manager API error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
};

function handleAddEmployee(req, res) {
    try {
        const employee = req.body;
        employee.employee_id = employee.employee_id || `EMP${String(data.employees.length + 1).padStart(3, '0')}`;
        
        // Find position name
        const positions = {
            '1': 'Electrician',
            '2': 'Field Supervisor', 
            '3': 'Apprentice',
            '4': 'General Laborer',
            '5': 'Temp'
        };
        employee.position = positions[employee.position_id] || 'Unknown';
        
        data.employees.push(employee);
        res.json({ success: true, message: 'Employee added successfully', employee });
    } catch (error) {
        res.status(400).json({ error: 'Failed to add employee', message: error.message });
    }
}

function handleAddProject(req, res) {
    try {
        const project = req.body;
        project.project_id = project.project_id || `PROJ-${String(data.projects.length + 1).padStart(3, '0')}`;
        
        data.projects.push(project);
        res.json({ success: true, message: 'Project added successfully', project });
    } catch (error) {
        res.status(400).json({ error: 'Failed to add project', message: error.message });
    }
}

function handleAddAssignment(req, res) {
    try {
        const assignment = req.body;
        assignment.assignment_id = data.assignments.length + 1;
        
        // Find employee and project names
        const employee = data.employees.find(e => e.employee_id === assignment.employee_id);
        const project = data.projects.find(p => p.project_id === assignment.project_id);
        
        assignment.employee_name = employee ? employee.name : 'Unknown Employee';
        assignment.project_name = project ? project.name : 'Unknown Project';
        
        data.assignments.push(assignment);
        res.json({ success: true, message: 'Assignment created successfully', assignment });
    } catch (error) {
        res.status(400).json({ error: 'Failed to create assignment', message: error.message });
    }
}

function handleExport(req, res, endpoint) {
    try {
        const type = endpoint.replace('export-', '');
        const format = req.query.format || 'csv';
        
        let exportData = [];
        let filename = '';
        
        switch (type) {
            case 'employees':
                exportData = data.employees;
                filename = 'employees';
                break;
            case 'projects':
                exportData = data.projects;
                filename = 'projects';
                break;
            case 'assignments':
                exportData = data.assignments;
                filename = 'assignments';
                break;
            default:
                return res.status(400).json({ error: 'Invalid export type' });
        }
        
        if (format === 'csv') {
            const csv = convertToCSV(exportData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csv);
        } else {
            res.json({ success: true, data: exportData, type, format });
        }
    } catch (error) {
        res.status(500).json({ error: 'Export failed', message: error.message });
    }
}

function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
}
