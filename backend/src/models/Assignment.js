/**
 * Assignment Model
 *
 * Handles all database operations related to employee assignments in the MetroPower Dashboard.
 * Includes CRUD operations, conflict detection, and assignment management logic.
 */

const { query, transaction } = require('../config/database')
const logger = require('../utils/logger')

class Assignment {
  /**
   * Get assignments for a specific date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Assignments data
   */
  static async getByDateRange (startDate, endDate, filters = {}) {
    try {
      const conditions = ['a.assignment_date >= $1', 'a.assignment_date <= $2']
      const params = [startDate, endDate]
      let paramIndex = 3

      if (filters.project_id) {
        conditions.push(`a.project_id = $${paramIndex++}`)
        params.push(filters.project_id)
      }

      if (filters.employee_id) {
        conditions.push(`a.employee_id = $${paramIndex++}`)
        params.push(filters.employee_id)
      }

      if (filters.position_id) {
        conditions.push(`e.position_id = $${paramIndex++}`)
        params.push(filters.position_id)
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      const assignmentsQuery = `
        SELECT 
          a.assignment_id,
          a.employee_id,
          e.name as employee_name,
          e.employee_number,
          e.position_id,
          pos.name as position_name,
          pos.code as position_code,
          pos.color_code as position_color,
          a.project_id,
          p.name as project_name,
          p.number as project_number,
          a.assignment_date,
          a.notes,
          a.created_at,
          a.updated_at,
          u1.first_name || ' ' || u1.last_name as created_by_name,
          u2.first_name || ' ' || u2.last_name as updated_by_name
        FROM assignments a
        JOIN employees e ON a.employee_id = e.employee_id
        JOIN positions pos ON e.position_id = pos.position_id
        JOIN projects p ON a.project_id = p.project_id
        LEFT JOIN users u1 ON a.created_by = u1.user_id
        LEFT JOIN users u2 ON a.updated_by = u2.user_id
        ${whereClause}
        ORDER BY a.assignment_date, p.name, e.name
      `

      const result = await query(assignmentsQuery, params)
      return result.rows
    } catch (error) {
      logger.error(`Error getting assignments for date range ${startDate} to ${endDate}:`, error)
      throw error
    }
  }

  /**
   * Get assignments for a specific week
   * @param {string} weekStartDate - Week start date (Monday, YYYY-MM-DD)
   * @returns {Promise<Object>} Week assignments organized by day and project
   */
  static async getWeekAssignments (weekStartDate) {
    try {
      // Calculate week end date (Friday)
      const weekEndDate = new Date(weekStartDate)
      weekEndDate.setDate(weekEndDate.getDate() + 4)
      const weekEndDateStr = weekEndDate.toISOString().split('T')[0]

      const assignments = await this.getByDateRange(weekStartDate, weekEndDateStr)

      // Organize assignments by day and project
      const weekData = {
        weekStart: weekStartDate,
        weekEnd: weekEndDateStr,
        days: {},
        projects: {},
        employees: {},
        summary: {
          totalAssignments: assignments.length,
          uniqueEmployees: new Set(),
          uniqueProjects: new Set()
        }
      }

      // Initialize days
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      days.forEach(day => {
        weekData.days[day] = {}
      })

      assignments.forEach(assignment => {
        const date = new Date(assignment.assignment_date)
        const dayName = days[date.getDay() - 1] // Monday = 0

        if (!weekData.days[dayName][assignment.project_id]) {
          weekData.days[dayName][assignment.project_id] = []
        }

        weekData.days[dayName][assignment.project_id].push(assignment)

        // Track projects
        if (!weekData.projects[assignment.project_id]) {
          weekData.projects[assignment.project_id] = {
            project_id: assignment.project_id,
            name: assignment.project_name,
            number: assignment.project_number
          }
        }

        // Track employees
        if (!weekData.employees[assignment.employee_id]) {
          weekData.employees[assignment.employee_id] = {
            employee_id: assignment.employee_id,
            name: assignment.employee_name,
            employee_number: assignment.employee_number,
            position_name: assignment.position_name,
            position_code: assignment.position_code,
            position_color: assignment.position_color
          }
        }

        // Update summary
        weekData.summary.uniqueEmployees.add(assignment.employee_id)
        weekData.summary.uniqueProjects.add(assignment.project_id)
      })

      // Convert sets to counts
      weekData.summary.uniqueEmployees = weekData.summary.uniqueEmployees.size
      weekData.summary.uniqueProjects = weekData.summary.uniqueProjects.size

      return weekData
    } catch (error) {
      logger.error(`Error getting week assignments for ${weekStartDate}:`, error)
      throw error
    }
  }

  /**
   * Create new assignment
   * @param {Object} assignmentData - Assignment data
   * @param {number} createdBy - User ID who created the assignment
   * @returns {Promise<Object>} Created assignment data
   */
  static async create (assignmentData, createdBy) {
    try {
      // Validate input data
      const validationErrors = this.validateAssignmentData(assignmentData)
      if (validationErrors.length > 0) {
        throw new Error('Validation error: ' + validationErrors.join(', '))
      }

      const { employee_id, project_id, assignment_date, notes, location, task_description } = assignmentData

      return await transaction(async (client) => {
        // Verify employee exists and is active
        const employeeCheck = await client.query(
          'SELECT employee_id, status FROM employees WHERE employee_id = $1',
          [employee_id]
        )

        if (employeeCheck.rows.length === 0) {
          throw new Error(`Employee with ID ${employee_id} not found`)
        }

        if (employeeCheck.rows[0].status === 'Terminated') {
          throw new Error(`Cannot assign terminated employee (ID: ${employee_id})`)
        }

        // Verify project exists and is active
        const projectCheck = await client.query(
          'SELECT project_id, status FROM projects WHERE project_id = $1',
          [project_id]
        )

        if (projectCheck.rows.length === 0) {
          throw new Error(`Project with ID ${project_id} not found`)
        }

        if (projectCheck.rows[0].status === 'Completed' || projectCheck.rows[0].status === 'Cancelled') {
          throw new Error(`Cannot assign to completed or cancelled project (ID: ${project_id})`)
        }

        // Check for conflicts (double-booking)
        const conflictCheck = await client.query(
          'SELECT assignment_id FROM assignments WHERE employee_id = $1 AND assignment_date = $2',
          [employee_id, assignment_date]
        )

        if (conflictCheck.rows.length > 0) {
          throw new Error(`Employee ${employee_id} is already assigned on ${assignment_date}`)
        }

        // Create the assignment
        const insertQuery = `
          INSERT INTO assignments (employee_id, project_id, assignment_date, notes, location, task_description, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `

        const result = await client.query(insertQuery, [
          employee_id, project_id, assignment_date, notes || null, location || null, task_description || null, createdBy
        ])

        const newAssignment = result.rows[0]

        // Log the assignment creation
        await client.query(`
          INSERT INTO assignment_history (
            assignment_id, employee_id, new_project_id, assignment_date, 
            change_reason, changed_by
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          newAssignment.assignment_id, employee_id, project_id, assignment_date,
          'Assignment created', createdBy
        ])

        logger.logBusiness('assignment_created', {
          assignmentId: newAssignment.assignment_id,
          employeeId: employee_id,
          projectId: project_id,
          assignmentDate: assignment_date,
          createdBy
        })

        return newAssignment
      })
    } catch (error) {
      logger.error('Error creating assignment:', error)
      throw error
    }
  }

  /**
   * Update assignment
   * @param {number} assignmentId - Assignment ID
   * @param {Object} updateData - Data to update
   * @param {number} updatedBy - User ID who updated the assignment
   * @returns {Promise<Object>} Updated assignment data
   */
  static async update (assignmentId, updateData, updatedBy) {
    try {
      // Validate input data (only validate provided fields)
      const validationErrors = this.validateAssignmentData(updateData, true)
      if (validationErrors.length > 0) {
        throw new Error('Validation error: ' + validationErrors.join(', '))
      }

      return await transaction(async (client) => {
        // Get current assignment data
        const currentResult = await client.query(
          'SELECT * FROM assignments WHERE assignment_id = $1',
          [assignmentId]
        )

        if (currentResult.rows.length === 0) {
          throw new Error('Assignment not found')
        }

        const currentAssignment = currentResult.rows[0]
        const { employee_id, project_id, assignment_date } = updateData

        // Verify employee exists and is active if employee is being changed
        if (employee_id && employee_id !== currentAssignment.employee_id) {
          const employeeCheck = await client.query(
            'SELECT employee_id, status FROM employees WHERE employee_id = $1',
            [employee_id]
          )

          if (employeeCheck.rows.length === 0) {
            throw new Error(`Employee with ID ${employee_id} not found`)
          }

          if (employeeCheck.rows[0].status === 'Terminated') {
            throw new Error(`Cannot assign terminated employee (ID: ${employee_id})`)
          }
        }

        // Verify project exists and is active if project is being changed
        if (project_id && project_id !== currentAssignment.project_id) {
          const projectCheck = await client.query(
            'SELECT project_id, status FROM projects WHERE project_id = $1',
            [project_id]
          )

          if (projectCheck.rows.length === 0) {
            throw new Error(`Project with ID ${project_id} not found`)
          }

          if (projectCheck.rows[0].status === 'Completed' || projectCheck.rows[0].status === 'Cancelled') {
            throw new Error(`Cannot assign to completed or cancelled project (ID: ${project_id})`)
          }
        }

        // Check for conflicts if employee or date is changing
        if ((employee_id && employee_id !== currentAssignment.employee_id) ||
            (assignment_date && assignment_date !== currentAssignment.assignment_date)) {
          const checkEmployeeId = employee_id || currentAssignment.employee_id
          const checkDate = assignment_date || currentAssignment.assignment_date

          const conflictCheck = await client.query(
            'SELECT assignment_id FROM assignments WHERE employee_id = $1 AND assignment_date = $2 AND assignment_id != $3',
            [checkEmployeeId, checkDate, assignmentId]
          )

          if (conflictCheck.rows.length > 0) {
            throw new Error(`Employee ${checkEmployeeId} is already assigned on ${checkDate}`)
          }
        }

        // Build update query
        const allowedFields = ['employee_id', 'project_id', 'assignment_date', 'notes']
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

        updates.push(`updated_by = $${paramIndex++}`)
        updates.push('updated_at = CURRENT_TIMESTAMP')
        params.push(updatedBy)
        params.push(assignmentId)

        const updateQuery = `
          UPDATE assignments 
          SET ${updates.join(', ')}
          WHERE assignment_id = $${paramIndex}
          RETURNING *
        `

        const result = await client.query(updateQuery, params)
        const updatedAssignment = result.rows[0]

        // Log the assignment change
        await client.query(`
          INSERT INTO assignment_history (
            assignment_id, employee_id, previous_project_id, new_project_id, 
            assignment_date, change_reason, changed_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          assignmentId,
          updatedAssignment.employee_id,
          currentAssignment.project_id,
          updatedAssignment.project_id,
          updatedAssignment.assignment_date,
          'Assignment updated',
          updatedBy
        ])

        logger.logBusiness('assignment_updated', {
          assignmentId,
          employeeId: updatedAssignment.employee_id,
          previousProjectId: currentAssignment.project_id,
          newProjectId: updatedAssignment.project_id,
          updatedBy
        })

        return updatedAssignment
      })
    } catch (error) {
      logger.error(`Error updating assignment ${assignmentId}:`, error)
      throw error
    }
  }

  /**
   * Delete assignment
   * @param {number} assignmentId - Assignment ID
   * @param {number} deletedBy - User ID who deleted the assignment
   * @returns {Promise<boolean>} Success status
   */
  static async delete (assignmentId, deletedBy) {
    try {
      return await transaction(async (client) => {
        // Get assignment data before deletion
        const assignmentResult = await client.query(
          'SELECT * FROM assignments WHERE assignment_id = $1',
          [assignmentId]
        )

        if (assignmentResult.rows.length === 0) {
          throw new Error('Assignment not found')
        }

        const assignment = assignmentResult.rows[0]

        // Log the assignment deletion
        await client.query(`
          INSERT INTO assignment_history (
            assignment_id, employee_id, previous_project_id, assignment_date, 
            change_reason, changed_by
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          assignmentId, assignment.employee_id, assignment.project_id,
          assignment.assignment_date, 'Assignment deleted', deletedBy
        ])

        // Delete the assignment
        await client.query('DELETE FROM assignments WHERE assignment_id = $1', [assignmentId])

        logger.logBusiness('assignment_deleted', {
          assignmentId,
          employeeId: assignment.employee_id,
          projectId: assignment.project_id,
          assignmentDate: assignment.assignment_date,
          deletedBy
        })

        return true
      })
    } catch (error) {
      logger.error(`Error deleting assignment ${assignmentId}:`, error)
      throw error
    }
  }

  /**
   * Bulk create assignments
   * @param {Array} assignments - Array of assignment data
   * @param {number} createdBy - User ID who created the assignments
   * @returns {Promise<Array>} Created assignments
   */
  static async bulkCreate (assignments, createdBy) {
    try {
      return await transaction(async (client) => {
        const createdAssignments = []

        for (const assignmentData of assignments) {
          const { employee_id, project_id, assignment_date, notes } = assignmentData

          // Check for conflicts
          const conflictCheck = await client.query(
            'SELECT assignment_id FROM assignments WHERE employee_id = $1 AND assignment_date = $2',
            [employee_id, assignment_date]
          )

          if (conflictCheck.rows.length > 0) {
            throw new Error(`Employee ${employee_id} is already assigned on ${assignment_date}`)
          }

          // Create assignment
          const result = await client.query(`
            INSERT INTO assignments (employee_id, project_id, assignment_date, notes, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
          `, [employee_id, project_id, assignment_date, notes, createdBy])

          const newAssignment = result.rows[0]
          createdAssignments.push(newAssignment)

          // Log the assignment
          await client.query(`
            INSERT INTO assignment_history (
              assignment_id, employee_id, new_project_id, assignment_date, 
              change_reason, changed_by
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            newAssignment.assignment_id, employee_id, project_id, assignment_date,
            'Bulk assignment created', createdBy
          ])
        }

        logger.logBusiness('bulk_assignments_created', {
          count: createdAssignments.length,
          createdBy
        })

        return createdAssignments
      })
    } catch (error) {
      logger.error('Error creating bulk assignments:', error)
      throw error
    }
  }

  /**
   * Get assignment conflicts for a date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Conflict data
   */
  static async getConflicts (startDate, endDate) {
    try {
      const conflictsQuery = `
        SELECT 
          employee_id,
          assignment_date,
          COUNT(*) as conflict_count,
          array_agg(project_id) as conflicting_projects
        FROM assignments
        WHERE assignment_date >= $1 AND assignment_date <= $2
        GROUP BY employee_id, assignment_date
        HAVING COUNT(*) > 1
        ORDER BY assignment_date, employee_id
      `

      const result = await query(conflictsQuery, [startDate, endDate])
      return result.rows
    } catch (error) {
      logger.error(`Error getting conflicts for date range ${startDate} to ${endDate}:`, error)
      throw error
    }
  }

  /**
   * Validate assignment data
   * @param {Object} assignmentData - Assignment data to validate
   * @param {boolean} isPartial - Whether this is partial validation (for updates)
   * @returns {Array} Array of validation error messages
   */
  static validateAssignmentData(assignmentData, isPartial = false) {
    const errors = []

    // Required fields (only check if not partial validation or if field is provided)
    if (!isPartial || assignmentData.hasOwnProperty('employee_id')) {
      if (!assignmentData.employee_id) {
        errors.push('Employee ID is required')
      } else if (!Number.isInteger(assignmentData.employee_id) || assignmentData.employee_id <= 0) {
        errors.push('Employee ID must be a positive integer')
      }
    }

    if (!isPartial || assignmentData.hasOwnProperty('project_id')) {
      if (!assignmentData.project_id) {
        errors.push('Project ID is required')
      } else if (!Number.isInteger(assignmentData.project_id) || assignmentData.project_id <= 0) {
        errors.push('Project ID must be a positive integer')
      }
    }

    if (!isPartial || assignmentData.hasOwnProperty('assignment_date')) {
      if (!assignmentData.assignment_date) {
        errors.push('Assignment date is required')
      } else {
        // Validate date format and range
        const assignmentDate = new Date(assignmentData.assignment_date)

        if (isNaN(assignmentDate.getTime())) {
          errors.push('Invalid assignment date format')
        } else {
          // Check date range (not more than 1 year in past or future)
          const today = new Date()
          const oneYearAgo = new Date()
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
          const oneYearFromNow = new Date()
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

          if (assignmentDate < oneYearAgo) {
            errors.push('Assignment date cannot be more than 1 year in the past')
          }

          if (assignmentDate > oneYearFromNow) {
            errors.push('Assignment date cannot be more than 1 year in the future')
          }
        }
      }
    }

    // Optional field length validation
    if (assignmentData.location && assignmentData.location.length > 255) {
      errors.push('Location must be less than 255 characters')
    }

    if (assignmentData.task_description && assignmentData.task_description.length > 1000) {
      errors.push('Task description must be less than 1000 characters')
    }

    if (assignmentData.notes && assignmentData.notes.length > 1000) {
      errors.push('Notes must be less than 1000 characters')
    }

    return errors
  }
}

module.exports = Assignment
