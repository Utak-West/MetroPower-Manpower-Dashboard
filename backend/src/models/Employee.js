/**
 * Employee Model
 *
 * Handles all database operations related to employees in the MetroPower Dashboard.
 * Includes CRUD operations, search, filtering, and business logic.
 */

const { query, transaction } = require('../config/database')
const logger = require('../utils/logger')

class Employee {
  /**
   * Get all employees with optional filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Employees data with metadata
   */
  static async getAll (filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 50, sortBy = 'name', sortOrder = 'ASC' } = pagination
      const offset = (page - 1) * limit

      // Build WHERE clause
      const conditions = []
      const params = []
      let paramIndex = 1

      if (filters.status) {
        conditions.push(`e.status = $${paramIndex++}`)
        params.push(filters.status)
      }

      if (filters.position_id) {
        conditions.push(`e.position_id = $${paramIndex++}`)
        params.push(filters.position_id)
      }

      if (filters.search) {
        conditions.push(`(e.name ILIKE $${paramIndex} OR e.employee_id ILIKE $${paramIndex} OR e.employee_number ILIKE $${paramIndex})`)
        params.push(`%${filters.search}%`)
        paramIndex++
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

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
      `

      params.push(limit, offset)

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM employees e
        LEFT JOIN positions p ON e.position_id = p.position_id
        ${whereClause}
      `

      const countParams = params.slice(0, -2) // Remove limit and offset

      const [employeesResult, countResult] = await Promise.all([
        query(employeesQuery, params),
        query(countQuery, countParams)
      ])

      const total = parseInt(countResult.rows[0].total)
      const totalPages = Math.ceil(total / limit)

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
      }
    } catch (error) {
      logger.error('Error getting employees:', error)
      throw error
    }
  }

  /**
   * Get employee by ID
   * @param {string} employeeId - Employee ID
   * @returns {Promise<Object|null>} Employee data or null
   */
  static async getById (employeeId) {
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
      `

      const result = await query(employeeQuery, [employeeId])
      return result.rows[0] || null
    } catch (error) {
      logger.error(`Error getting employee ${employeeId}:`, error)
      throw error
    }
  }

  /**
   * Create new employee
   * @param {Object} employeeData - Employee data
   * @param {number} createdBy - User ID who created the employee
   * @returns {Promise<Object>} Created employee data
   */
  static async create (employeeData, createdBy) {
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
      } = employeeData

      const insertQuery = `
        INSERT INTO employees (
          employee_id, name, position_id, status, employee_number,
          hire_date, phone, email, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `

      const params = [
        employee_id, name, position_id, status, employee_number,
        hire_date, phone, email, notes
      ]

      const result = await query(insertQuery, params)
      const newEmployee = result.rows[0]

      logger.logBusiness('employee_created', {
        employeeId: newEmployee.employee_id,
        name: newEmployee.name,
        createdBy
      })

      return await this.getById(newEmployee.employee_id)
    } catch (error) {
      logger.error('Error creating employee:', error)
      throw error
    }
  }

  /**
   * Update employee
   * @param {string} employeeId - Employee ID
   * @param {Object} updateData - Data to update
   * @param {number} updatedBy - User ID who updated the employee
   * @returns {Promise<Object>} Updated employee data
   */
  static async update (employeeId, updateData, updatedBy) {
    try {
      const allowedFields = [
        'name', 'position_id', 'status', 'employee_number',
        'hire_date', 'phone', 'email', 'notes'
      ]

      const updates = []
      const params = []
      let paramIndex = 1

      Object.entries(updateData).forEach(([key, value]) => {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = $${paramIndex++}`)
          params.push(value)
        }
      })

      if (updates.length === 0) {
        throw new Error('No valid fields to update')
      }

      params.push(employeeId)

      const updateQuery = `
        UPDATE employees 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $${paramIndex}
        RETURNING *
      `

      const result = await query(updateQuery, params)

      if (result.rows.length === 0) {
        throw new Error('Employee not found')
      }

      logger.logBusiness('employee_updated', {
        employeeId,
        updatedFields: Object.keys(updateData),
        updatedBy
      })

      return await this.getById(employeeId)
    } catch (error) {
      logger.error(`Error updating employee ${employeeId}:`, error)
      throw error
    }
  }

  /**
   * Soft delete employee (set status to Terminated)
   * @param {string} employeeId - Employee ID
   * @param {number} deletedBy - User ID who deleted the employee
   * @returns {Promise<boolean>} Success status
   */
  static async delete (employeeId, deletedBy) {
    try {
      return await transaction(async (client) => {
        // Update employee status to Terminated
        const updateResult = await client.query(
          'UPDATE employees SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE employee_id = $2 RETURNING *',
          ['Terminated', employeeId]
        )

        if (updateResult.rows.length === 0) {
          throw new Error('Employee not found')
        }

        // Remove future assignments
        await client.query(
          'DELETE FROM assignments WHERE employee_id = $1 AND assignment_date > CURRENT_DATE',
          [employeeId]
        )

        logger.logBusiness('employee_deleted', {
          employeeId,
          deletedBy
        })

        return true
      })
    } catch (error) {
      logger.error(`Error deleting employee ${employeeId}:`, error)
      throw error
    }
  }

  /**
   * Get unassigned employees for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} Unassigned employees
   */
  static async getUnassigned (date) {
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
      `

      const result = await query(unassignedQuery, [date])
      return result.rows
    } catch (error) {
      logger.error(`Error getting unassigned employees for ${date}:`, error)
      throw error
    }
  }

  /**
   * Search employees by name or ID
   * @param {string} searchTerm - Search term
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Array>} Matching employees
   */
  static async search (searchTerm, limit = 20) {
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
      `

      const searchPattern = `%${searchTerm}%`
      const exactPattern = `${searchTerm}%`

      const result = await query(searchQuery, [searchPattern, exactPattern, limit])
      return result.rows
    } catch (error) {
      logger.error(`Error searching employees with term "${searchTerm}":`, error)
      throw error
    }
  }

  /**
   * Get employee statistics
   * @returns {Promise<Object>} Employee statistics
   */
  static async getStatistics () {
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
      `

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
      `

      const [statsResult, positionStatsResult] = await Promise.all([
        query(statsQuery),
        query(positionStatsQuery)
      ])

      return {
        overall: statsResult.rows[0],
        byPosition: positionStatsResult.rows
      }
    } catch (error) {
      logger.error('Error getting employee statistics:', error)
      throw error
    }
  }

  /**
   * Create a new employee
   * @param {Object} employeeData - Employee data
   * @param {number} createdBy - User ID who created the employee
   * @returns {Promise<Object>} Created employee
   */
  static async create(employeeData, createdBy) {
    try {
      return await transaction(async (client) => {
        // Generate employee ID
        const employeeIdResult = await client.query(
          'SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 2) AS INTEGER)), 0) + 1 as next_id FROM employees WHERE employee_id ~ \'^E[0-9]+$\''
        );
        const employeeId = `E${employeeIdResult.rows[0].next_id}`;

        // Generate employee number
        const employeeNumberResult = await client.query(
          'SELECT COALESCE(MAX(CAST(employee_number AS INTEGER)), 1000) + 1 as next_number FROM employees WHERE employee_number ~ \'^[0-9]+$\''
        );
        const employeeNumber = employeeNumberResult.rows[0].next_number.toString();

        // Get or create position
        let positionId;
        const positionResult = await client.query(
          'SELECT position_id FROM positions WHERE name = $1',
          [employeeData.trade || employeeData.position || 'General Laborer']
        );

        if (positionResult.rows.length > 0) {
          positionId = positionResult.rows[0].position_id;
        } else {
          // Create new position
          const newPositionResult = await client.query(
            'INSERT INTO positions (name, code, color_code) VALUES ($1, $2, $3) RETURNING position_id',
            [
              employeeData.trade || employeeData.position || 'General Laborer',
              (employeeData.trade || employeeData.position || 'GEN').substring(0, 10).toUpperCase(),
              '#95a5a6'
            ]
          );
          positionId = newPositionResult.rows[0].position_id;
        }

        // Insert employee
        const insertQuery = `
          INSERT INTO employees (
            employee_id, name, position_id, status, employee_number,
            hire_date, phone, email, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;

        const employeeName = `${employeeData.first_name} ${employeeData.last_name}`;
        const result = await client.query(insertQuery, [
          employeeId,
          employeeName,
          positionId,
          employeeData.status || 'Active',
          employeeNumber,
          employeeData.hire_date || new Date().toISOString().split('T')[0],
          employeeData.phone || '',
          employeeData.email || `${employeeData.first_name?.toLowerCase()}.${employeeData.last_name?.toLowerCase()}@metropower.com`,
          employeeData.notes || ''
        ]);

        const newEmployee = result.rows[0];

        logger.info('Employee created successfully', {
          employeeId: newEmployee.employee_id,
          name: newEmployee.name,
          createdBy
        });

        return newEmployee;
      });
    } catch (error) {
      logger.error('Error creating employee:', error);
      throw error;
    }
  }

  /**
   * Update an employee
   * @param {string} employeeId - Employee ID
   * @param {Object} employeeData - Updated employee data
   * @param {number} updatedBy - User ID who updated the employee
   * @returns {Promise<Object|null>} Updated employee or null if not found
   */
  static async update(employeeId, employeeData, updatedBy) {
    try {
      return await transaction(async (client) => {
        // Check if employee exists
        const existingEmployee = await client.query(
          'SELECT * FROM employees WHERE employee_id = $1',
          [employeeId]
        );

        if (existingEmployee.rows.length === 0) {
          return null;
        }

        // Get or create position if trade/position changed
        let positionId = existingEmployee.rows[0].position_id;
        if (employeeData.trade || employeeData.position) {
          const positionResult = await client.query(
            'SELECT position_id FROM positions WHERE name = $1',
            [employeeData.trade || employeeData.position]
          );

          if (positionResult.rows.length > 0) {
            positionId = positionResult.rows[0].position_id;
          } else {
            // Create new position
            const newPositionResult = await client.query(
              'INSERT INTO positions (name, code, color_code) VALUES ($1, $2, $3) RETURNING position_id',
              [
                employeeData.trade || employeeData.position,
                (employeeData.trade || employeeData.position).substring(0, 10).toUpperCase(),
                '#95a5a6'
              ]
            );
            positionId = newPositionResult.rows[0].position_id;
          }
        }

        // Build update query
        const updateFields = [];
        const params = [];
        let paramIndex = 1;

        if (employeeData.first_name && employeeData.last_name) {
          updateFields.push(`name = $${paramIndex++}`);
          params.push(`${employeeData.first_name} ${employeeData.last_name}`);
        }

        if (positionId !== existingEmployee.rows[0].position_id) {
          updateFields.push(`position_id = $${paramIndex++}`);
          params.push(positionId);
        }

        if (employeeData.status) {
          updateFields.push(`status = $${paramIndex++}`);
          params.push(employeeData.status);
        }

        if (employeeData.phone) {
          updateFields.push(`phone = $${paramIndex++}`);
          params.push(employeeData.phone);
        }

        if (employeeData.email) {
          updateFields.push(`email = $${paramIndex++}`);
          params.push(employeeData.email);
        }

        if (employeeData.notes !== undefined) {
          updateFields.push(`notes = $${paramIndex++}`);
          params.push(employeeData.notes);
        }

        if (employeeData.hire_date) {
          updateFields.push(`hire_date = $${paramIndex++}`);
          params.push(employeeData.hire_date);
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

        if (updateFields.length === 1) { // Only updated_at was added
          return existingEmployee.rows[0]; // No changes to make
        }

        params.push(employeeId);
        const updateQuery = `
          UPDATE employees
          SET ${updateFields.join(', ')}
          WHERE employee_id = $${paramIndex}
          RETURNING *
        `;

        const result = await client.query(updateQuery, params);

        logger.info('Employee updated successfully', {
          employeeId,
          updatedBy
        });

        return result.rows[0];
      });
    } catch (error) {
      logger.error('Error updating employee:', error);
      throw error;
    }
  }

  /**
   * Delete an employee (soft delete by setting status to 'Terminated')
   * @param {string} employeeId - Employee ID
   * @param {number} deletedBy - User ID who deleted the employee
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(employeeId, deletedBy) {
    try {
      const result = await query(
        'UPDATE employees SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE employee_id = $2 AND status != $1 RETURNING employee_id',
        ['Terminated', employeeId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      logger.info('Employee deleted (soft delete)', {
        employeeId,
        deletedBy
      });

      return true;
    } catch (error) {
      logger.error('Error deleting employee:', error);
      throw error;
    }
  }

  /**
   * Get unassigned employees for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} Unassigned employees
   */
  static async getUnassignedForDate(date) {
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
          e.employee_number,
          e.phone,
          e.email
        FROM employees e
        LEFT JOIN positions p ON e.position_id = p.position_id
        LEFT JOIN assignments a ON e.employee_id = a.employee_id AND a.assignment_date = $1
        WHERE e.status = 'Active' AND a.assignment_id IS NULL
        ORDER BY e.name
      `;

      const result = await query(unassignedQuery, [date]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting unassigned employees:', error);
      throw error;
    }
  }
}

module.exports = Employee
