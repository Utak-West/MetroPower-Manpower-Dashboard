/**
 * Demo Service
 *
 * Provides in-memory data and authentication for demo mode
 * when database is not available or USE_MEMORY_DB is enabled.
 *
 * Copyright 2025 The HigherSelf Network
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/app');
const logger = require('../utils/logger');

// In-memory data storage
let demoUsers = [];
let demoEmployees = [];
let demoProjects = [];
let demoAssignments = [];

/**
 * Load parsed Excel data
 */
const loadParsedExcelData = () => {
  try {
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(__dirname, '..', '..', '..', 'parsed-excel-data.json');

    if (fs.existsSync(dataPath)) {
      const rawData = fs.readFileSync(dataPath, 'utf8');
      const parsedData = JSON.parse(rawData);
      console.log('Loaded parsed Excel data:', {
        employees: parsedData.employees?.length || 0,
        projects: parsedData.projects?.length || 0,
        assignments: parsedData.assignments?.length || 0
      });
      return parsedData;
    }
  } catch (error) {
    console.warn('Could not load parsed Excel data:', error.message);
  }
  return null;
};

/**
 * Get skills for a position
 */
const getSkillsForPosition = (position) => {
  const skillsMap = {
    'Electrician': ['Electrical Systems', 'Wiring', 'Safety', 'Troubleshooting'],
    'Field Supervisor': ['Leadership', 'Project Management', 'Safety', 'Team Coordination'],
    'Apprentice': ['Learning', 'Basic Electrical', 'Safety', 'Tool Handling'],
    'General Laborer': ['Manual Labor', 'Equipment Handling', 'Safety', 'Support'],
    'Temp': ['General Support', 'Basic Tasks', 'Safety'],
    'Service Tech': ['Equipment Maintenance', 'Diagnostics', 'Repair', 'Safety'],
    'Foreman': ['Leadership', 'Project Coordination', 'Safety', 'Quality Control']
  };

  return skillsMap[position] || ['General Skills', 'Safety'];
};

/**
 * Initialize demo data
 */
const initializeDemoData = async () => {
  try {
    logger.info('Starting demo data initialization...');

    // Create demo users with hashed passwords
    logger.info('Creating password hashes...');
    let adminPasswordHash, managerPasswordHash;

    try {
      // Admin password
      const adminPassword = 'MetroPower2025!';
      adminPasswordHash = await bcrypt.hash(adminPassword, 12);
      logger.info('Admin password hash created');

      // Manager password - Both users use MetroPower2025!
      const managerPassword = 'MetroPower2025!';
      managerPasswordHash = await bcrypt.hash(managerPassword, 12);
      logger.info('Manager password hash created');
    } catch (bcryptError) {
      logger.warn('Bcrypt failed, using pre-computed hashes:', bcryptError.message);
      // Fallback to pre-computed hashes - both using MetroPower2025!
      adminPasswordHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9PS'; // MetroPower2025!
      managerPasswordHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9PS'; // MetroPower2025!
    }

    demoUsers = [
      {
        user_id: 1,
        username: 'admin',
        email: 'admin@metropower.com',
        password_hash: adminPasswordHash,
        first_name: 'System',
        last_name: 'Administrator',
        role: 'Admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null
      },
      {
        user_id: 2,
        username: 'antione.harrell',
        email: 'antione.harrell@metropower.com',
        password_hash: managerPasswordHash,
        first_name: 'Antione',
        last_name: 'Harrell',
        role: 'Project Manager',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null
      }
    ];

    // Load Excel data or create demo employees
    logger.info('Loading Excel data...');
    const excelData = loadParsedExcelData();
    logger.info('Excel data loaded:', { hasData: !!excelData });

    if (excelData && excelData.employees && excelData.employees.length > 0) {
      // Use real Excel data
      console.log('Using real employee data from Excel file');
      demoEmployees = excelData.employees.map(emp => ({
        employee_id: emp.employee_id,
        name: emp.name, // Keep the full name for database insertion
        first_name: emp.name.split(' ')[0] || emp.name,
        last_name: emp.name.split(' ').slice(1).join(' ') || '',
        email: emp.email,
        phone: emp.phone,
        position: emp.position,
        trade: emp.position, // Add trade alias for compatibility
        department: emp.department,
        hire_date: emp.hire_date,
        status: emp.status, // Keep original status field
        is_active: emp.status === 'Active',
        employee_number: emp.employee_number,
        skills: getSkillsForPosition(emp.position)
      }));
    } else {
      // Fallback to demo data
      console.log('Using fallback demo employee data');
      demoEmployees = [
      {
        employee_id: 1,
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@metropower.com',
        phone: '555-0101',
        position: 'Electrician',
        department: 'Field Operations',
        hire_date: '2023-01-15',
        is_active: true,
        skills: ['Electrical', 'Safety', 'Troubleshooting']
      },
      {
        employee_id: 2,
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@metropower.com',
        phone: '555-0102',
        position: 'Line Technician',
        department: 'Field Operations',
        hire_date: '2023-03-20',
        is_active: true,
        skills: ['Power Lines', 'Safety', 'Equipment Maintenance']
      },
      {
        employee_id: 3,
        first_name: 'Mike',
        last_name: 'Davis',
        email: 'mike.davis@metropower.com',
        phone: '555-0103',
        position: 'Safety Inspector',
        department: 'Safety & Compliance',
        hire_date: '2022-11-10',
        is_active: true,
        skills: ['Safety Inspection', 'Compliance', 'Documentation']
      },
      {
        employee_id: 4,
        first_name: 'Lisa',
        last_name: 'Wilson',
        email: 'lisa.wilson@metropower.com',
        phone: '555-0104',
        position: 'Equipment Operator',
        department: 'Field Operations',
        hire_date: '2023-05-08',
        is_active: true,
        skills: ['Heavy Equipment', 'Maintenance', 'Safety']
      }
      ];
    }

    // Load projects from Excel data or create demo projects
    if (excelData && excelData.projects && excelData.projects.length > 0) {
      console.log('Using real project data from Excel file');
      demoProjects = excelData.projects;
    } else {
      console.log('Using fallback demo project data');
      demoProjects = [
      {
        project_id: 1,
        name: 'Tucker Substation Upgrade',
        description: 'Upgrade electrical infrastructure at Tucker substation',
        status: 'Active',
        start_date: '2025-06-01',
        end_date: '2025-08-30',
        priority: 'High',
        location: 'Tucker, GA'
      },
      {
        project_id: 2,
        name: 'Power Line Maintenance - Route 85',
        description: 'Routine maintenance on power lines along Route 85',
        status: 'Active',
        start_date: '2025-06-10',
        end_date: '2025-07-15',
        priority: 'Medium',
        location: 'Route 85 Corridor'
      },
      {
        project_id: 3,
        name: 'Emergency Response Training',
        description: 'Quarterly emergency response training for field crews',
        status: 'Scheduled',
        start_date: '2025-07-01',
        end_date: '2025-07-05',
        priority: 'Medium',
        location: 'Training Center'
      }
      ];
    }

    // Load assignments from Excel data or create demo assignments
    if (excelData && excelData.assignments && excelData.assignments.length > 0) {
      console.log('Using real assignment data from Excel file');
      demoAssignments = excelData.assignments;
    } else {
      console.log('Using fallback demo assignment data');
      // Create demo assignments with MVP fields
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      demoAssignments = [
      {
        assignment_id: 1,
        employee_id: 1,
        project_id: 1,
        date: today.toISOString().split('T')[0],
        task_description: 'Install new electrical panels and wiring',
        location: 'Tucker Substation - Building A',
        notes: 'Bring safety equipment and voltage tester',
        shift: 'Day',
        status: 'Assigned',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        assignment_id: 2,
        employee_id: 2,
        project_id: 2,
        date: today.toISOString().split('T')[0],
        task_description: 'Inspect and maintain power lines',
        location: 'Route 85 - Mile Marker 15-20',
        notes: 'Check for vegetation clearance and equipment wear',
        shift: 'Day',
        status: 'Assigned',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        assignment_id: 3,
        employee_id: 3,
        project_id: 1,
        date: tomorrow.toISOString().split('T')[0],
        task_description: 'Safety inspection of completed electrical work',
        location: 'Tucker Substation - All Buildings',
        notes: 'Complete safety checklist and documentation',
        shift: 'Day',
        status: 'Scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        assignment_id: 4,
        employee_id: 4,
        project_id: 3,
        date: yesterday.toISOString().split('T')[0],
        task_description: 'Equipment maintenance and calibration',
        location: 'Equipment Yard - Section C',
        notes: 'Focus on heavy machinery and testing equipment',
        shift: 'Day',
        status: 'Completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      ];
    }

    logger.info('Demo data initialized successfully');
    logger.info(`Demo users: ${demoUsers.length}, Employees: ${demoEmployees.length}, Projects: ${demoProjects.length}`);
  } catch (error) {
    logger.error('Failed to initialize demo data:', error);
    logger.error('Error stack:', error.stack);

    // Try to provide minimal fallback data
    if (demoUsers.length === 0) {
      logger.warn('Creating minimal fallback user data');
      demoUsers = [
        {
          user_id: 1,
          username: 'admin',
          email: 'admin@metropower.com',
          password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9PS',
          first_name: 'System',
          last_name: 'Administrator',
          role: 'Admin',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          last_login: null
        },
        {
          user_id: 2,
          username: 'antione.harrell',
          email: 'antione.harrell@metropower.com',
          password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9PS', // MetroPower2025!
          first_name: 'Antione',
          last_name: 'Harrell',
          role: 'Project Manager',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          last_login: null
        }
      ];
    }

    throw error;
  }
};

/**
 * Find user by ID
 */
const findUserById = async (userId) => {
  const user = demoUsers.find(u => u.user_id === parseInt(userId));
  if (user) {
    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
};

/**
 * Find user by identifier (username or email)
 */
const findUserByIdentifier = async (identifier) => {
  return demoUsers.find(u => u.username === identifier || u.email === identifier) || null;
};

/**
 * Update user last login
 */
const updateUserLastLogin = async (userId) => {
  const user = demoUsers.find(u => u.user_id === parseInt(userId));
  if (user) {
    user.last_login = new Date();
    user.updated_at = new Date();
  }
};

/**
 * Get all employees
 */
const getEmployees = async () => {
  return demoEmployees;
};

/**
 * Get unassigned employees for a specific date
 */
const getUnassignedEmployees = async (date) => {
  const assignedEmployeeIds = demoAssignments
    .filter(a => a.date === date)
    .map(a => a.employee_id);
  
  return demoEmployees.filter(emp => !assignedEmployeeIds.includes(emp.employee_id));
};

/**
 * Get active projects
 */
const getActiveProjects = async () => {
  return demoProjects.filter(p => p.status === 'Active');
};

/**
 * Get week assignments
 */
const getWeekAssignments = async (weekStartDate) => {
  const weekStart = new Date(weekStartDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekAssignments = [];
  
  for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayAssignments = demoAssignments.filter(a => a.date === dateStr);
    
    weekAssignments.push({
      date: dateStr,
      assignments: dayAssignments.map(a => ({
        ...a,
        employee: demoEmployees.find(e => e.employee_id === a.employee_id),
        project: demoProjects.find(p => p.project_id === a.project_id)
      }))
    });
  }

  return weekAssignments;
};

/**
 * Get dashboard metrics
 */
const getDashboardMetrics = async () => {
  const today = new Date().toISOString().split('T')[0];
  const todayAssignments = demoAssignments.filter(a => a.date === today);
  const unassignedToday = await getUnassignedEmployees(today);

  return {
    totalEmployees: demoEmployees.length,
    activeProjects: demoProjects.filter(p => p.status === 'Active').length,
    todayAssignments: todayAssignments.length,
    unassignedToday: unassignedToday
  };
};

/**
 * Get all assignments
 */
const getAssignments = async () => {
  return demoAssignments.map(assignment => ({
    ...assignment,
    employee: demoEmployees.find(e => e.employee_id === assignment.employee_id),
    project: demoProjects.find(p => p.project_id === assignment.project_id)
  }));
};

/**
 * Create new assignment
 */
const createAssignment = async (assignmentData) => {
  const { employee_id, project_id, assignment_date, task_description, location, notes } = assignmentData;

  // Generate new assignment ID
  const newId = Math.max(...demoAssignments.map(a => a.assignment_id), 0) + 1;

  // Create assignment with MVP fields
  const newAssignment = {
    assignment_id: newId,
    employee_id: parseInt(employee_id),
    project_id: parseInt(project_id),
    date: assignment_date,
    task_description: task_description || '',
    location: location || '',
    notes: notes || '',
    shift: 'Day',
    status: 'Assigned',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  demoAssignments.push(newAssignment);

  // Return assignment with employee and project details
  return {
    ...newAssignment,
    employee: demoEmployees.find(e => e.employee_id === newAssignment.employee_id),
    project: demoProjects.find(p => p.project_id === newAssignment.project_id)
  };
};

/**
 * Update assignment
 */
const updateAssignment = async (assignmentId, updateData) => {
  const assignmentIndex = demoAssignments.findIndex(a => a.assignment_id === assignmentId);

  if (assignmentIndex === -1) {
    throw new Error('Assignment not found');
  }

  // Update assignment with new data
  const updatedAssignment = {
    ...demoAssignments[assignmentIndex],
    ...updateData,
    updated_at: new Date().toISOString()
  };

  demoAssignments[assignmentIndex] = updatedAssignment;

  // Return assignment with employee and project details
  return {
    ...updatedAssignment,
    employee: demoEmployees.find(e => e.employee_id === updatedAssignment.employee_id),
    project: demoProjects.find(p => p.project_id === updatedAssignment.project_id)
  };
};

/**
 * Delete assignment
 */
const deleteAssignment = async (assignmentId) => {
  const assignmentIndex = demoAssignments.findIndex(a => a.assignment_id === assignmentId);

  if (assignmentIndex === -1) {
    throw new Error('Assignment not found');
  }

  demoAssignments.splice(assignmentIndex, 1);
  return true;
};

/**
 * Get projects (alias for getActiveProjects for consistency)
 */
const getProjects = async () => {
  return demoProjects;
};

/**
 * Get projects with assignment statistics
 */
const getProjectsWithStats = async () => {
  const today = new Date().toISOString().split('T')[0];

  return demoProjects.map(project => {
    // Count current assignments for this project
    const currentAssignments = demoAssignments.filter(a =>
      a.project_id === project.project_id && a.date === today
    );

    // Count total assignments for this project
    const totalAssignments = demoAssignments.filter(a =>
      a.project_id === project.project_id
    );

    // Get unique employees assigned to this project
    const uniqueEmployees = [...new Set(totalAssignments.map(a => a.employee_id))];

    return {
      ...project,
      currentAssignments: currentAssignments.length,
      totalAssignments: totalAssignments.length,
      uniqueEmployees: uniqueEmployees.length,
      lastAssignmentDate: totalAssignments.length > 0
        ? Math.max(...totalAssignments.map(a => new Date(a.date).getTime()))
        : null
    };
  });
};

/**
 * Add a new project
 */
const addProject = async (projectData) => {
  try {
    // Check if project ID already exists
    const existingProject = demoProjects.find(p => p.project_id === projectData.project_id);
    if (existingProject) {
      logger.warn(`Project ID ${projectData.project_id} already exists`);
      return false;
    }

    // Add the new project
    demoProjects.push(projectData);
    logger.info(`Project added: ${projectData.project_id}`);
    return true;
  } catch (error) {
    logger.error('Error adding project:', error);
    return false;
  }
};

/**
 * Update an existing project
 */
const updateProject = async (projectId, updatedData) => {
  try {
    const projectIndex = demoProjects.findIndex(p => p.project_id === projectId);
    if (projectIndex === -1) {
      logger.warn(`Project ${projectId} not found for update`);
      return false;
    }

    // Preserve original creation data
    const originalProject = demoProjects[projectIndex];
    demoProjects[projectIndex] = {
      ...originalProject,
      ...updatedData,
      project_id: projectId, // Ensure ID doesn't change
      created_at: originalProject.created_at, // Preserve creation date
      created_by: originalProject.created_by // Preserve creator
    };

    logger.info(`Project updated: ${projectId}`);
    return true;
  } catch (error) {
    logger.error('Error updating project:', error);
    return false;
  }
};

/**
 * Add a new employee
 */
const addEmployee = async (employeeData) => {
  try {
    // Generate employee ID if not provided
    const employeeId = employeeData.employee_id || (demoEmployees.length + 1);

    // Generate employee number if not provided
    const employeeNumber = employeeData.employee_number || `EMP${String(demoEmployees.length + 1).padStart(4, '0')}`;

    // Create new employee object
    const newEmployee = {
      employee_id: employeeId,
      name: `${employeeData.first_name} ${employeeData.last_name}`,
      first_name: employeeData.first_name,
      last_name: employeeData.last_name,
      trade: employeeData.trade || employeeData.position,
      level: employeeData.level || 'Entry',
      hourly_rate: parseFloat(employeeData.hourly_rate) || 25.00,
      status: employeeData.status || 'Active',
      employee_number: employeeNumber,
      hire_date: employeeData.hire_date || new Date().toISOString().split('T')[0],
      phone: employeeData.phone || '(555) 000-0000',
      email: employeeData.email || `${employeeData.first_name?.toLowerCase()}.${employeeData.last_name?.toLowerCase()}@metropower.com`,
      notes: employeeData.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add to demo employees array
    demoEmployees.push(newEmployee);

    logger.info(`Employee added: ${newEmployee.name} (${newEmployee.employee_id})`);
    return newEmployee;
  } catch (error) {
    logger.error('Error adding employee:', error);
    throw error;
  }
};

/**
 * Update an existing employee
 */
const updateEmployee = async (employeeId, updatedData) => {
  try {
    const employeeIndex = demoEmployees.findIndex(e => e.employee_id == employeeId);
    if (employeeIndex === -1) {
      logger.warn(`Employee ${employeeId} not found for update`);
      return false;
    }

    // Update the employee
    const updatedEmployee = {
      ...demoEmployees[employeeIndex],
      ...updatedData,
      updated_at: new Date().toISOString()
    };

    // Update name if first_name or last_name changed
    if (updatedData.first_name || updatedData.last_name) {
      updatedEmployee.name = `${updatedEmployee.first_name} ${updatedEmployee.last_name}`;
    }

    demoEmployees[employeeIndex] = updatedEmployee;

    logger.info(`Employee updated: ${updatedEmployee.name} (${employeeId})`);
    return updatedEmployee;
  } catch (error) {
    logger.error('Error updating employee:', error);
    throw error;
  }
};

// Demo data will be initialized explicitly by the server

module.exports = {
  initializeDemoData,
  findUserById,
  findUserByIdentifier,
  updateUserLastLogin,
  getEmployees,
  getUnassignedEmployees,
  getActiveProjects,
  getProjects,
  getProjectsWithStats,
  addProject,
  updateProject,
  addEmployee,
  updateEmployee,
  getWeekAssignments,
  getDashboardMetrics,
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment
};
