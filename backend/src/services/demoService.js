/**
 * Demo Service
 *
 * Provides in-memory data and functionality when database is unavailable
 * for the MetroPower Dashboard demonstration mode.
 *
 * Copyright 2025 The HigherSelf Network
 */

const logger = require('../utils/logger')
const bcrypt = require('bcryptjs')

// In-memory demo data
const demoData = {
  users: [
    {
      user_id: 1,
      username: 'antione.harrell',
      email: 'antione.harrell@metropower.com',
      password_hash: '$2a$12$cEgWLRNksZ/iqU7ITn2Duub0UNXXQZIykrDkn.2T4p2MKJkMRzepu', // bcrypt hash for "password123"
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
      username: 'admin',
      email: 'admin@metropower.com',
      password_hash: '$2a$12$hKm4NLl1VP5z5xvLG/zSweI60yePOujZHEf6L1yPdkxWi5OZRpxEO', // bcrypt hash for "MetroPower2025!"
      first_name: 'System',
      last_name: 'Administrator',
      role: 'Admin',
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
      email: 'john.smith@metropower.com',
      phone: '(555) 123-4567',
      trade: 'Senior Electrician',
      hourly_rate: 28.50,
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z'
    },
    {
      employee_id: 2,
      first_name: 'Mike',
      last_name: 'Johnson',
      email: 'mike.johnson@metropower.com',
      phone: '(555) 234-5678',
      trade: 'Electrician',
      hourly_rate: 25.00,
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z'
    },
    {
      employee_id: 3,
      first_name: 'Sarah',
      last_name: 'Williams',
      email: 'sarah.williams@metropower.com',
      phone: '(555) 345-6789',
      trade: 'Apprentice Electrician',
      hourly_rate: 18.00,
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z'
    },
    {
      employee_id: 4,
      first_name: 'David',
      last_name: 'Brown',
      email: 'david.brown@metropower.com',
      phone: '(555) 456-7890',
      trade: 'Field Supervisor',
      hourly_rate: 32.00,
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z'
    },
    {
      employee_id: 5,
      first_name: 'Lisa',
      last_name: 'Davis',
      email: 'lisa.davis@metropower.com',
      phone: '(555) 567-8901',
      trade: 'General Laborer',
      hourly_rate: 16.00,
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z'
    }
  ],
  projects: [
    {
      project_id: 1,
      project_name: 'Downtown Office Complex',
      project_code: 'DOC-2024-001',
      client_name: 'Metro Development Corp',
      start_date: '2024-06-01',
      end_date: '2024-08-31',
      status: 'Active',
      project_manager: 'Antione Harrell',
      estimated_hours: 2400,
      actual_hours: 600
    },
    {
      project_id: 2,
      project_name: 'Industrial Warehouse Upgrade',
      project_code: 'IWU-2024-002',
      client_name: 'Atlanta Logistics Inc',
      start_date: '2024-05-15',
      end_date: '2024-07-15',
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
}

class DemoService {
  /**
   * Initialize demo service
   */
  static initialize () {
    logger.info('Demo service initialized with in-memory data')
    logger.info(`Demo users: ${demoData.users.length}`)
    logger.info(`Demo employees: ${demoData.employees.length}`)
    logger.info(`Demo projects: ${demoData.projects.length}`)
    logger.info(`Demo assignments: ${demoData.assignments.length}`)
  }

  /**
   * Find user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} User data or null
   */
  static async findUserById (userId) {
    const user = demoData.users.find(u => u.user_id === userId)
    return user ? { ...user } : null
  }

  /**
   * Find user by identifier (username or email)
   * @param {string} identifier - Username or email
   * @returns {Promise<Object|null>} User data or null
   */
  static async findUserByIdentifier (identifier) {
    const user = demoData.users.find(u =>
      u.username === identifier || u.email === identifier
    )
    return user ? { ...user } : null
  }

  /**
   * Get all employees
   * @returns {Promise<Array>} Array of employees
   */
  static async getEmployees () {
    return [...demoData.employees]
  }

  /**
   * Get unassigned employees for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of unassigned employees
   */
  static async getUnassignedEmployees (date) {
    const assignedEmployeeIds = demoData.assignments
      .filter(a => a.assignment_date === date)
      .map(a => a.employee_id)

    return demoData.employees.filter(e => 
      e.is_active && !assignedEmployeeIds.includes(e.employee_id)
    )
  }

  /**
   * Get active projects
   * @returns {Promise<Array>} Array of active projects
   */
  static async getActiveProjects () {
    return demoData.projects.filter(p => p.status === 'Active')
  }

  /**
   * Get week assignments for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Week assignments object
   */
  static async getWeekAssignments (date) {
    // For demo, return assignments for the current week
    const assignments = {}
    const today = new Date().toISOString().split('T')[0]
    
    // Generate assignments for the week
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + i)
      const dateStr = currentDate.toISOString().split('T')[0]
      
      assignments[dateStr] = demoData.assignments.filter(a => 
        a.assignment_date === dateStr || a.assignment_date === today
      )
    }
    
    return assignments
  }

  /**
   * Get dashboard metrics
   * @returns {Promise<Object>} Dashboard metrics
   */
  static async getDashboardMetrics () {
    const today = new Date().toISOString().split('T')[0]

    return {
      totalEmployees: demoData.employees.filter(e => e.is_active).length,
      activeProjects: demoData.projects.filter(p => p.status === 'Active').length,
      todayAssignments: demoData.assignments.filter(a => a.assignment_date === today).length,
      unassignedToday: await this.getUnassignedEmployees(today)
    }
  }

  /**
   * Create assignment (demo mode)
   * @param {Object} assignmentData - Assignment data
   * @returns {Promise<Object>} Created assignment
   */
  static async createAssignment (assignmentData) {
    const newAssignment = {
      assignment_id: Math.max(...demoData.assignments.map(a => a.assignment_id)) + 1,
      ...assignmentData,
      status: 'Assigned'
    }

    demoData.assignments.push(newAssignment)

    logger.info('Demo assignment created', {
      assignmentId: newAssignment.assignment_id,
      employeeId: newAssignment.employee_id,
      projectId: newAssignment.project_id
    })

    return newAssignment
  }
}

// Initialize demo service
DemoService.initialize()

module.exports = DemoService
