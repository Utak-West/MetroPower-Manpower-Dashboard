/**
 * Employee Model
 * 
 * Handles all database operations related to employees in the MetroPower Dashboard.
 * Includes CRUD operations, search, filtering, and business logic.
 */

const { query, transaction } = require('../config/database');
const logger = require('../utils/logger');
const config = require('../config/app');

class Employee {
  /**
   * Get all employees with optional filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Employees data with metadata
   */
  static async getAll(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 50, sortBy = 'name', sortOrder = 'ASC' } = pagination;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      if (filters.status) {
        conditions.push(`e.status = $${paramIndex++}`);
        params.push(filters.status);
      }

      if (filters.position_id) {
        conditions.push(`e.position_id = $${paramIndex++}`);
        params.push(filters.position_id);
      }

      if (filters.search) {
        conditions.push(`(e.name ILIKE $${paramIndex} OR e.employee_id ILIKE $${paramIndex} OR e.employee_number ILIKE $${paramIndex})`);
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Main query
      const employeesQuery = `
        SELECT 
          e.employee_id,
          e.name,
          e.position_id,
          p.name as position_name,
          p.code as position_code,
          p.color_code as position_color,
          e.status,
          e.employee_number,
          e.hire_date,
          e.phone,
          e.email,
          e.notes,
          e.created_at,
          e.updated_at
        FROM employees e
        LEFT JOIN positions p ON e.position_id = p.position_id
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM employees e
        LEFT JOIN positions p ON e.position_id = p.position_id
        ${whereClause}
      `;

      const countParams = params.slice(0, -2); // Remove limit and offset

      const [employeesResult, countResult] = await Promise.all([
        query(employeesQuery, params),
        query(countQuery, countParams)
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        employees: employeesResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

    } catch (error) {
      logger.error('Error getting employees:', error);
      throw error;
    }
  }

  /**
   * Get employee by ID
   * @param {string} employeeId - Employee ID
   * @returns {Promise<Object|null>} Employee data or null
   */
  static async getById(employeeId) {
    try {
      const employeeQuery = `
        SELECT 
          e.employee_id,
          e.name,
          e.position_id,
          p.name as position_name,
          p.code as position_code,
          p.color_code as position_color,
          e.status,
          e.employee_number,
          e.hire_date,
          e.phone,
          e.email,
          e.notes,
          e.created_at,
          e.updated_at
        FROM employees e
        LEFT JOIN positions p ON e.position_id = p.position_id
        WHERE e.employee_id = $1
      `;

      const result = await query(employeeQuery, [employeeId]);
      return result.rows[0] || null;

    } catch (error) {
      logger.error(`Error getting employee ${employeeId}:`, error);
      throw error;
    }
  }

  /**
   * Create new employee
   * @param {Object} employeeData - Employee data
   * @param {number} createdBy - User ID who created the employee
   * @returns {Promise<Object>} Created employee data
   */
  static async create(employeeData, createdBy) {
    try {
      const {
        employee_id,
        name,
        position_id,
        status = 'Active',
        employee_number,
        hire_date,
        phone,
        email,
        notes
      } = employeeData;

      const insertQuery = `
        INSERT INTO employees (
          employee_id, name, position_id, status, employee_number,
          hire_date, phone, email, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const params = [
        employee_id, name, position_id, status, employee_number,
        hire_date, phone, email, notes
      ];

      const result = await query(insertQuery, params);
      const newEmployee = result.rows[0];

      logger.logBusiness('employee_created', {
        employeeId: newEmployee.employee_id,
        name: newEmployee.name,
        createdBy
      });

      return await this.getById(newEmployee.employee_id);

    } catch (error) {
      logger.error('Error creating employee:', error);
      throw error;
    }
  }

  /**
   * Update employee
   * @param {string} employeeId - Employee ID
   * @param {Object} updateData - Data to update
   * @param {number} updatedBy - User ID who updated the employee
   * @returns {Promise<Object>} Updated employee data
   */
  static async update(employeeId, updateData, updatedBy) {
    try {
      const allowedFields = [
        'name', 'position_id', 'status', 'employee_number',
        'hire_date', 'phone', 'email', 'notes'
      ];

      const updates = [];
      const params = [];
      let paramIndex = 1;

      Object.entries(updateData).forEach(([key, value]) => {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = $${paramIndex++}`);
          params.push(value);
        }
      });

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      params.push(employeeId);

      const updateQuery = `
        UPDATE employees 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $${paramIndex}
        RETURNING *
      `;

      const result = await query(updateQuery, params);
      
      if (result.rows.length === 0) {
        throw new Error('Employee not found');
      }

      logger.logBusiness('employee_updated', {
        employeeId,
        updatedFields: Object.keys(updateData),
        updatedBy
      });

      return await this.getById(employeeId);

    } catch (error) {
      logger.error(`Error updating employee ${employeeId}:`, error);
      throw error;
    }
  }

  /**
   * Soft delete employee (set status to Terminated)
   * @param {string} employeeId - Employee ID
   * @param {number} deletedBy - User ID who deleted the employee
   * @returns {Promise<boolean>} Success status
   */
  static async delete(employeeId, deletedBy) {
    try {
      return await transaction(async (client) => {
        // Update employee status to Terminated
        const updateResult = await client.query(
          'UPDATE employees SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE employee_id = $2 RETURNING *',
          ['Terminated', employeeId]
        );

        if (updateResult.rows.length === 0) {
          throw new Error('Employee not found');
        }

        // Remove future assignments
        await client.query(
          'DELETE FROM assignments WHERE employee_id = $1 AND assignment_date > CURRENT_DATE',
          [employeeId]
        );

        logger.logBusiness('employee_deleted', {
          employeeId,
          deletedBy
        });

        return true;
      });

    } catch (error) {
      logger.error(`Error deleting employee ${employeeId}:`, error);
      throw error;
    }
  }

  /**
   * Get unassigned employees for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} Unassigned employees
   */
  static async getUnassigned(date) {
    try {
      const unassignedQuery = `
        SELECT 
          e.employee_id,
          e.name,
          e.position_id,
          p.name as position_name,
          p.code as position_code,
          p.color_code as position_color,
          e.status,
          e.employee_number
        FROM employees e
        LEFT JOIN positions p ON e.position_id = p.position_id
        LEFT JOIN assignments a ON e.employee_id = a.employee_id AND a.assignment_date = $1
        WHERE e.status = 'Active' AND a.assignment_id IS NULL
        ORDER BY e.name
      `;

      const result = await query(unassignedQuery, [date]);
      return result.rows;

    } catch (error) {
      logger.error(`Error getting unassigned employees for ${date}:`, error);
      throw error;
    }
  }

  /**
   * Search employees by name or ID
   * @param {string} searchTerm - Search term
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Array>} Matching employees
   */
  static async search(searchTerm, limit = 20) {
    try {
      const searchQuery = `
        SELECT 
          e.employee_id,
          e.name,
          e.position_id,
          p.name as position_name,
          p.code as position_code,
          p.color_code as position_color,
          e.status,
          e.employee_number
        FROM employees e
        LEFT JOIN positions p ON e.position_id = p.position_id
        WHERE (
          e.name ILIKE $1 OR 
          e.employee_id ILIKE $1 OR 
          e.employee_number ILIKE $1
        ) AND e.status = 'Active'
        ORDER BY 
          CASE 
            WHEN e.name ILIKE $2 THEN 1
            WHEN e.employee_id ILIKE $2 THEN 2
            ELSE 3
          END,
          e.name
        LIMIT $3
      `;

      const searchPattern = `%${searchTerm}%`;
      const exactPattern = `${searchTerm}%`;
      
      const result = await query(searchQuery, [searchPattern, exactPattern, limit]);
      return result.rows;

    } catch (error) {
      logger.error(`Error searching employees with term "${searchTerm}":`, error);
      throw error;
    }
  }

  /**
   * Get employee statistics
   * @returns {Promise<Object>} Employee statistics
   */
  static async getStatistics() {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_employees,
          COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_employees,
          COUNT(CASE WHEN status = 'PTO' THEN 1 END) as pto_employees,
          COUNT(CASE WHEN status = 'Leave' THEN 1 END) as leave_employees,
          COUNT(CASE WHEN status = 'Military' THEN 1 END) as military_employees,
          COUNT(CASE WHEN status = 'Terminated' THEN 1 END) as terminated_employees
        FROM employees
      `;

      const positionStatsQuery = `
        SELECT 
          p.name as position_name,
          p.code as position_code,
          p.color_code as position_color,
          COUNT(e.employee_id) as count
        FROM positions p
        LEFT JOIN employees e ON p.position_id = e.position_id AND e.status = 'Active'
        GROUP BY p.position_id, p.name, p.code, p.color_code
        ORDER BY count DESC
      `;

      const [statsResult, positionStatsResult] = await Promise.all([
        query(statsQuery),
        query(positionStatsQuery)
      ]);

      return {
        overall: statsResult.rows[0],
        byPosition: positionStatsResult.rows
      };

    } catch (error) {
      logger.error('Error getting employee statistics:', error);
      throw error;
    }
  }
}

module.exports = Employee;
