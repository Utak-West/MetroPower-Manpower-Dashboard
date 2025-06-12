/**
 * Demo Service
 *
 * Provides in-memory data and functionality when database is unavailable
 * for the MetroPower Dashboard demonstration mode.
 *
 * Copyright 2025 The HigherSelf Network
 */

const config = require('../config/app');
const logger = require('../utils/logger');

// In-memory demo data
let demoData = {
  users: [
    {
      user_id: 1,
      username: 'antione.harrell',
      email: 'antione.harrell@metropower.com',
      password_hash: '$2a$12$demo.hash.for.antione.harrell', // Demo hash
      first_name: 'Antione',
      last_name: 'Harrell',
      role: 'Project Manager',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      last_login: new Date().toISOString()
    },
    {
      user_id: 2,
      username: 'demo.user',
      email: 'demo@metropower.com',
      password_hash: '$2a$12$demo.hash.for.demo.user', // Demo hash
      first_name: 'Demo',
      last_name: 'User',
      role: 'View Only',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      last_login: new Date().toISOString()
    }
  ],
  employees: [
    {
      employee_id: 1,
      first_name: 'John',
      last_name: 'Smith',
      trade: 'Electrician',
      level: 'Journeyman',
      hourly_rate: 28.50,
      is_active: true,
      hire_date: '2023-01-15',
      phone: '555-0101',
      email: 'john.smith@metropower.com'
    },
    {
      employee_id: 2,
      first_name: 'Mike',
      last_name: 'Johnson',
      trade: 'Electrician',
      level: 'Apprentice',
      hourly_rate: 22.00,
      is_active: true,
      hire_date: '2023-03-20',
      phone: '555-0102',
      email: 'mike.johnson@metropower.com'
    },
    {
      employee_id: 3,
      first_name: 'Sarah',
      last_name: 'Williams',
      trade: 'Field Supervisor',
      level: 'Senior',
      hourly_rate: 35.00,
      is_active: true,
      hire_date: '2022-08-10',
      phone: '555-0103',
      email: 'sarah.williams@metropower.com'
    },
    {
      employee_id: 4,
      first_name: 'David',
      last_name: 'Brown',
      trade: 'Electrician',
      level: 'Master',
      hourly_rate: 32.00,
      is_active: true,
      hire_date: '2021-11-05',
      phone: '555-0104',
      email: 'david.brown@metropower.com'
    },
    {
      employee_id: 5,
      first_name: 'Lisa',
      last_name: 'Davis',
      trade: 'Electrician',
      level: 'Journeyman',
      hourly_rate: 29.00,
      is_active: true,
      hire_date: '2023-02-14',
      phone: '555-0105',
      email: 'lisa.davis@metropower.com'
    }
  ],
  projects: [
    {
      project_id: 1,
      project_name: 'Tucker Mall Renovation',
      project_code: 'TM-2024-001',
      client_name: 'Tucker Development Corp',
      start_date: '2024-01-15',
      end_date: '2024-06-30',
      status: 'Active',
      project_manager: 'Antione Harrell',
      estimated_hours: 2400,
      actual_hours: 1200
    },
    {
      project_id: 2,
      project_name: 'Office Complex Wiring',
      project_code: 'OC-2024-002',
      client_name: 'Metro Business Park',
      start_date: '2024-02-01',
      end_date: '2024-05-15',
      status: 'Active',
      project_manager: 'Antione Harrell',
      estimated_hours: 1800,
      actual_hours: 900
    },
    {
      project_id: 3,
      project_name: 'Residential Development',
      project_code: 'RD-2024-003',
      client_name: 'Tucker Homes LLC',
      start_date: '2024-03-01',
      end_date: '2024-08-31',
      status: 'Active',
      project_manager: 'Antione Harrell',
      estimated_hours: 3200,
      actual_hours: 800
    }
  ],
  assignments: [
    {
      assignment_id: 1,
      employee_id: 1,
      project_id: 1,
      assignment_date: new Date().toISOString().split('T')[0],
      hours_assigned: 8,
      status: 'Assigned'
    },
    {
      assignment_id: 2,
      employee_id: 2,
      project_id: 1,
      assignment_date: new Date().toISOString().split('T')[0],
      hours_assigned: 8,
      status: 'Assigned'
    },
    {
      assignment_id: 3,
      employee_id: 3,
      project_id: 2,
      assignment_date: new Date().toISOString().split('T')[0],
      hours_assigned: 8,
      status: 'Assigned'
    }
  ]
};

class DemoService {
  /**
   * Initialize demo service
   */
  static initialize() {
    logger.info('Demo service initialized with in-memory data');
    logger.info(`Demo users: ${demoData.users.length}`);
    logger.info(`Demo employees: ${demoData.employees.length}`);
    logger.info(`Demo projects: ${demoData.projects.length}`);
    logger.info(`Demo assignments: ${demoData.assignments.length}`);
  }

  /**
   * Find user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} User data or null
   */
  static async findUserById(userId) {
    const user = demoData.users.find(u => u.user_id === userId);
    return user ? { ...user } : null;
  }

  /**
   * Find user by identifier (username or email)
   * @param {string} identifier - Username or email
   * @returns {Promise<Object|null>} User data or null
   */
  static async findUserByIdentifier(identifier) {
    const user = demoData.users.find(u =>
      u.username === identifier || u.email === identifier
    );
    return user ? { ...user } : null;
  }

  /**
   * Get all employees
   * @returns {Promise<Array>} Array of employees
   */
  static async getEmployees() {
    return [...demoData.employees];
  }

  /**
   * Get unassigned employees for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of unassigned employees
   */
  static async getUnassignedEmployees(date) {
    const assignedEmployeeIds = demoData.assignments
      .filter(a => a.assignment_date === date)
      .map(a => a.employee_id);

    return demoData.employees.filter(e =>
      e.is_active && !assignedEmployeeIds.includes(e.employee_id)
    );
  }

  /**
   * Get all projects
   * @returns {Promise<Array>} Array of projects
   */
  static async getProjects() {
    return [...demoData.projects];
  }

  /**
   * Get active projects
   * @returns {Promise<Array>} Array of active projects
   */
  static async getActiveProjects() {
    return demoData.projects.filter(p => p.status === 'Active');
  }

  /**
   * Get assignments for a specific week
   * @param {string} weekStart - Week start date in YYYY-MM-DD format
   * @returns {Promise<Object>} Assignments grouped by date and project
   */
  static async getWeekAssignments(weekStart) {
    const weekDates = [];
    const startDate = new Date(weekStart);

    // Generate 7 days from start date
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      weekDates.push(date.toISOString().split('T')[0]);
    }

    const assignments = {};

    weekDates.forEach(date => {
      assignments[date] = {};

      demoData.projects.forEach(project => {
        assignments[date][project.project_id] = demoData.assignments
          .filter(a => a.assignment_date === date && a.project_id === project.project_id)
          .map(a => {
            const employee = demoData.employees.find(e => e.employee_id === a.employee_id);
            return {
              ...a,
              employee
            };
          });
      });
    });

    return assignments;
  }

  /**
   * Get dashboard metrics
   * @returns {Promise<Object>} Dashboard metrics
   */
  static async getDashboardMetrics() {
    const today = new Date().toISOString().split('T')[0];

    return {
      totalEmployees: demoData.employees.filter(e => e.is_active).length,
      activeProjects: demoData.projects.filter(p => p.status === 'Active').length,
      todayAssignments: demoData.assignments.filter(a => a.assignment_date === today).length,
      unassignedToday: await this.getUnassignedEmployees(today)
    };
  }

  /**
   * Create assignment (demo mode)
   * @param {Object} assignmentData - Assignment data
   * @returns {Promise<Object>} Created assignment
   */
  static async createAssignment(assignmentData) {
    const newAssignment = {
      assignment_id: Math.max(...demoData.assignments.map(a => a.assignment_id)) + 1,
      ...assignmentData,
      status: 'Assigned'
    };

    demoData.assignments.push(newAssignment);

    logger.info('Demo assignment created', {
      assignmentId: newAssignment.assignment_id,
      employeeId: newAssignment.employee_id,
      projectId: newAssignment.project_id
    });

    return newAssignment;
  }

  /**
   * Update assignment (demo mode)
   * @param {number} assignmentId - Assignment ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated assignment
   */
  static async updateAssignment(assignmentId, updateData) {
    const index = demoData.assignments.findIndex(a => a.assignment_id === assignmentId);

    if (index === -1) {
      throw new Error('Assignment not found');
    }

    demoData.assignments[index] = {
      ...demoData.assignments[index],
      ...updateData
    };

    logger.info('Demo assignment updated', {
      assignmentId,
      updateData
    });

    return demoData.assignments[index];
  }

  /**
   * Delete assignment (demo mode)
   * @param {number} assignmentId - Assignment ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteAssignment(assignmentId) {
    const index = demoData.assignments.findIndex(a => a.assignment_id === assignmentId);

    if (index === -1) {
      throw new Error('Assignment not found');
    }

    demoData.assignments.splice(index, 1);

    logger.info('Demo assignment deleted', {
      assignmentId
    });

    return true;
  }
}

// Initialize demo service when module is loaded
DemoService.initialize();

module.exports = DemoService;
