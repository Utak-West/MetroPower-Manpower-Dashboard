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
 * Initialize demo data
 */
const initializeDemoData = async () => {
  try {
    // Create demo users with hashed passwords
    const adminPasswordHash = await bcrypt.hash('MetroPower2025!', 12);
    const managerPasswordHash = await bcrypt.hash('password123', 12);

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

    // Create demo employees
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

    // Create demo projects
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

    // Create demo assignments
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    demoAssignments = [
      {
        assignment_id: 1,
        employee_id: 1,
        project_id: 1,
        date: today.toISOString().split('T')[0],
        shift: 'Day',
        status: 'Assigned'
      },
      {
        assignment_id: 2,
        employee_id: 2,
        project_id: 2,
        date: today.toISOString().split('T')[0],
        shift: 'Day',
        status: 'Assigned'
      },
      {
        assignment_id: 3,
        employee_id: 3,
        project_id: 1,
        date: tomorrow.toISOString().split('T')[0],
        shift: 'Day',
        status: 'Scheduled'
      }
    ];

    logger.info('Demo data initialized successfully');
    logger.info(`Demo users: ${demoUsers.length}, Employees: ${demoEmployees.length}, Projects: ${demoProjects.length}`);
  } catch (error) {
    logger.error('Failed to initialize demo data:', error);
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

// Demo data will be initialized explicitly by the server

module.exports = {
  initializeDemoData,
  findUserById,
  findUserByIdentifier,
  updateUserLastLogin,
  getEmployees,
  getUnassignedEmployees,
  getActiveProjects,
  getWeekAssignments,
  getDashboardMetrics
};
