/**
 * Demo Service for MetroPower Dashboard
 * 
 * Provides in-memory database operations for demo mode.
 * Simulates database queries using mock data.
 */

const { 
  demoUsers, 
  demoEmployees, 
  demoProjects, 
  demoAssignments, 
  demoNotifications 
} = require('../data/demoData');

class DemoService {
  constructor() {
    // Create copies of demo data to allow modifications
    this.users = [...demoUsers];
    this.employees = [...demoEmployees];
    this.projects = [...demoProjects];
    this.assignments = [...demoAssignments];
    this.notifications = [...demoNotifications];
    
    // Auto-increment IDs
    this.nextUserId = Math.max(...this.users.map(u => u.user_id)) + 1;
    this.nextEmployeeId = Math.max(...this.employees.map(e => e.employee_id)) + 1;
    this.nextProjectId = Math.max(...this.projects.map(p => p.project_id)) + 1;
    this.nextAssignmentId = Math.max(...this.assignments.map(a => a.assignment_id)) + 1;
    this.nextNotificationId = Math.max(...this.notifications.map(n => n.notification_id)) + 1;
  }

  // Simulate database query method
  async query(sql, params = []) {
    // This is a simplified simulation - in a real implementation,
    // you'd parse the SQL and execute the appropriate operation
    
    // For demo purposes, we'll handle common query patterns
    const sqlLower = sql.toLowerCase().trim();
    
    if (sqlLower.includes('select') && sqlLower.includes('users')) {
      return { rows: this.users };
    }
    
    if (sqlLower.includes('select') && sqlLower.includes('employees')) {
      return { rows: this.employees };
    }
    
    if (sqlLower.includes('select') && sqlLower.includes('projects')) {
      return { rows: this.projects };
    }
    
    if (sqlLower.includes('select') && sqlLower.includes('assignments')) {
      return { rows: this.assignments };
    }
    
    if (sqlLower.includes('select') && sqlLower.includes('notifications')) {
      return { rows: this.notifications };
    }
    
    // Default empty result
    return { rows: [] };
  }

  // User operations
  async findUserByEmail(email) {
    const user = this.users.find(u => u.email === email);
    return user || null;
  }

  async findUserById(id) {
    const user = this.users.find(u => u.user_id === id);
    return user || null;
  }

  // Employee operations
  async getAllEmployees() {
    return this.employees.filter(e => e.is_active);
  }

  async getEmployeeById(id) {
    return this.employees.find(e => e.employee_id === id && e.is_active) || null;
  }

  async createEmployee(employeeData) {
    const newEmployee = {
      employee_id: this.nextEmployeeId++,
      ...employeeData,
      created_at: new Date().toISOString(),
      is_active: true
    };
    this.employees.push(newEmployee);
    return newEmployee;
  }

  async updateEmployee(id, updates) {
    const index = this.employees.findIndex(e => e.employee_id === id);
    if (index !== -1) {
      this.employees[index] = { ...this.employees[index], ...updates };
      return this.employees[index];
    }
    return null;
  }

  // Project operations
  async getAllProjects() {
    return this.projects;
  }

  async getProjectById(id) {
    return this.projects.find(p => p.project_id === id) || null;
  }

  // Assignment operations
  async getAssignmentsByDate(date) {
    return this.assignments.filter(a => a.date === date);
  }

  async getAssignmentsByEmployee(employeeId) {
    return this.assignments.filter(a => a.employee_id === employeeId);
  }

  async getAssignmentsByProject(projectId) {
    return this.assignments.filter(a => a.project_id === projectId);
  }

  async createAssignment(assignmentData) {
    const newAssignment = {
      assignment_id: this.nextAssignmentId++,
      ...assignmentData,
      created_at: new Date().toISOString(),
      status: 'Assigned'
    };
    this.assignments.push(newAssignment);
    return newAssignment;
  }

  async updateAssignment(id, updates) {
    const index = this.assignments.findIndex(a => a.assignment_id === id);
    if (index !== -1) {
      this.assignments[index] = { ...this.assignments[index], ...updates };
      return this.assignments[index];
    }
    return null;
  }

  async deleteAssignment(id) {
    const index = this.assignments.findIndex(a => a.assignment_id === id);
    if (index !== -1) {
      return this.assignments.splice(index, 1)[0];
    }
    return null;
  }

  // Dashboard operations
  async getDashboardData(date) {
    const assignments = await this.getAssignmentsByDate(date);
    const totalEmployees = this.employees.filter(e => e.is_active).length;
    const assignedEmployees = new Set(assignments.map(a => a.employee_id)).size;
    const unassignedEmployees = totalEmployees - assignedEmployees;
    const activeProjects = this.projects.filter(p => p.status === 'Active').length;

    return {
      totalEmployees,
      assignedEmployees,
      unassignedEmployees,
      activeProjects,
      totalAssignments: assignments.length,
      assignments
    };
  }

  // Notification operations
  async getNotificationsByUser(userId) {
    return this.notifications.filter(n => n.recipient_id === userId);
  }

  async markNotificationAsRead(id) {
    const index = this.notifications.findIndex(n => n.notification_id === id);
    if (index !== -1) {
      this.notifications[index].read_status = true;
      return this.notifications[index];
    }
    return null;
  }

  // Statistics
  async getEmployeeStatistics() {
    const total = this.employees.filter(e => e.is_active).length;
    const assigned = new Set(this.assignments.map(a => a.employee_id)).size;
    const unassigned = total - assigned;
    
    return {
      total,
      assigned,
      unassigned,
      utilization: total > 0 ? Math.round((assigned / total) * 100) : 0
    };
  }

  async getProjectStatistics() {
    const total = this.projects.length;
    const active = this.projects.filter(p => p.status === 'Active').length;
    const planned = this.projects.filter(p => p.status === 'Planned').length;
    const completed = this.projects.filter(p => p.status === 'Completed').length;
    
    return {
      total,
      active,
      planned,
      completed
    };
  }

  // Search operations
  async searchEmployees(query) {
    const searchTerm = query.toLowerCase();
    return this.employees.filter(e => 
      e.is_active && (
        e.first_name.toLowerCase().includes(searchTerm) ||
        e.last_name.toLowerCase().includes(searchTerm) ||
        e.email.toLowerCase().includes(searchTerm) ||
        e.position.toLowerCase().includes(searchTerm)
      )
    );
  }

  // Reset demo data (useful for testing)
  resetData() {
    this.users = [...demoUsers];
    this.employees = [...demoEmployees];
    this.projects = [...demoProjects];
    this.assignments = [...demoAssignments];
    this.notifications = [...demoNotifications];
  }
}

// Export singleton instance
module.exports = new DemoService();
