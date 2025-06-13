/**
 * Project Model
 *
 * Handles all database operations related to projects in the MetroPower Dashboard.
 * Includes CRUD operations, search, filtering, and project management logic.
 */

const { query, transaction } = require('../config/database')
const logger = require('../utils/logger')

class Project {
  /**
   * Get all projects with optional filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Projects data with metadata
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
        conditions.push(`p.status = $${paramIndex++}`)
        params.push(filters.status)
      }

      if (filters.manager_id) {
        conditions.push(`p.manager_id = $${paramIndex++}`)
        params.push(filters.manager_id)
      }

      if (filters.search) {
        conditions.push(`(p.name ILIKE $${paramIndex} OR p.number ILIKE $${paramIndex} OR p.project_id ILIKE $${paramIndex})`)
        params.push(`%${filters.search}%`)
        paramIndex++
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      // Main query
      const projectsQuery = `
        SELECT 
          p.project_id,
          p.name,
          p.number,
          p.status,
          p.start_date,
          p.end_date,
          p.location,
          p.manager_id,
          u.first_name || ' ' || u.last_name as manager_name,
          p.description,
          p.budget,
          p.created_at,
          p.updated_at,
          COUNT(a.assignment_id) as current_assignments
        FROM projects p
        LEFT JOIN users u ON p.manager_id = u.user_id
        LEFT JOIN assignments a ON p.project_id = a.project_id AND a.assignment_date = CURRENT_DATE
        ${whereClause}
        GROUP BY p.project_id, u.first_name, u.last_name
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `

      params.push(limit, offset)

      // Count query
      const countQuery = `
        SELECT COUNT(DISTINCT p.project_id) as total
        FROM projects p
        LEFT JOIN users u ON p.manager_id = u.user_id
        ${whereClause}
      `

      const countParams = params.slice(0, -2) // Remove limit and offset

      const [projectsResult, countResult] = await Promise.all([
        query(projectsQuery, params),
        query(countQuery, countParams)
      ])

      const total = parseInt(countResult.rows[0].total)
      const totalPages = Math.ceil(total / limit)

      return {
        projects: projectsResult.rows,
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
      logger.error('Error getting projects:', error)
      throw error
    }
  }

  /**
   * Get project by ID
   * @param {string} projectId - Project ID
   * @returns {Promise<Object|null>} Project data or null
   */
  static async getById (projectId) {
    try {
      const projectQuery = `
        SELECT 
          p.project_id,
          p.name,
          p.number,
          p.status,
          p.start_date,
          p.end_date,
          p.location,
          p.manager_id,
          u.first_name || ' ' || u.last_name as manager_name,
          u.email as manager_email,
          p.description,
          p.budget,
          p.created_at,
          p.updated_at
        FROM projects p
        LEFT JOIN users u ON p.manager_id = u.user_id
        WHERE p.project_id = $1
      `

      const result = await query(projectQuery, [projectId])
      return result.rows[0] || null
    } catch (error) {
      logger.error(`Error getting project ${projectId}:`, error)
      throw error
    }
  }

  /**
   * Create new project
   * @param {Object} projectData - Project data
   * @param {number} createdBy - User ID who created the project
   * @returns {Promise<Object>} Created project data
   */
  static async create (projectData, createdBy) {
    try {
      const {
        project_id,
        name,
        number,
        status = 'Active',
        start_date,
        end_date,
        location,
        manager_id,
        description,
        budget
      } = projectData

      const insertQuery = `
        INSERT INTO projects (
          project_id, name, number, status, start_date, end_date,
          location, manager_id, description, budget
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `

      const params = [
        project_id, name, number, status, start_date, end_date,
        location, manager_id, description, budget
      ]

      const result = await query(insertQuery, params)
      const newProject = result.rows[0]

      logger.logBusiness('project_created', {
        projectId: newProject.project_id,
        name: newProject.name,
        createdBy
      })

      return await this.getById(newProject.project_id)
    } catch (error) {
      logger.error('Error creating project:', error)
      throw error
    }
  }

  /**
   * Update project
   * @param {string} projectId - Project ID
   * @param {Object} updateData - Data to update
   * @param {number} updatedBy - User ID who updated the project
   * @returns {Promise<Object>} Updated project data
   */
  static async update (projectId, updateData, updatedBy) {
    try {
      const allowedFields = [
        'name', 'number', 'status', 'start_date', 'end_date',
        'location', 'manager_id', 'description', 'budget'
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

      params.push(projectId)

      const updateQuery = `
        UPDATE projects 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE project_id = $${paramIndex}
        RETURNING *
      `

      const result = await query(updateQuery, params)

      if (result.rows.length === 0) {
        throw new Error('Project not found')
      }

      logger.logBusiness('project_updated', {
        projectId,
        updatedFields: Object.keys(updateData),
        updatedBy
      })

      return await this.getById(projectId)
    } catch (error) {
      logger.error(`Error updating project ${projectId}:`, error)
      throw error
    }
  }

  /**
   * Delete project (only if no assignments exist)
   * @param {string} projectId - Project ID
   * @param {number} deletedBy - User ID who deleted the project
   * @returns {Promise<boolean>} Success status
   */
  static async delete (projectId, deletedBy) {
    try {
      return await transaction(async (client) => {
        // Check if project has any assignments
        const assignmentCheck = await client.query(
          'SELECT COUNT(*) as count FROM assignments WHERE project_id = $1',
          [projectId]
        )

        if (parseInt(assignmentCheck.rows[0].count) > 0) {
          throw new Error('Cannot delete project with existing assignments')
        }

        // Delete the project
        const deleteResult = await client.query(
          'DELETE FROM projects WHERE project_id = $1 RETURNING *',
          [projectId]
        )

        if (deleteResult.rows.length === 0) {
          throw new Error('Project not found')
        }

        logger.logBusiness('project_deleted', {
          projectId,
          deletedBy
        })

        return true
      })
    } catch (error) {
      logger.error(`Error deleting project ${projectId}:`, error)
      throw error
    }
  }

  /**
   * Get active projects (for dashboard display)
   * @returns {Promise<Array>} Active projects
   */
  static async getActive () {
    try {
      const activeProjectsQuery = `
        SELECT 
          p.project_id,
          p.name,
          p.number,
          p.location,
          p.manager_id,
          u.first_name || ' ' || u.last_name as manager_name,
          COUNT(a.assignment_id) as current_assignments
        FROM projects p
        LEFT JOIN users u ON p.manager_id = u.user_id
        LEFT JOIN assignments a ON p.project_id = a.project_id AND a.assignment_date = CURRENT_DATE
        WHERE p.status = 'Active'
        GROUP BY p.project_id, u.first_name, u.last_name
        ORDER BY p.name
      `

      const result = await query(activeProjectsQuery)
      return result.rows
    } catch (error) {
      logger.error('Error getting active projects:', error)
      throw error
    }
  }

  /**
   * Get project assignments for a specific date range
   * @param {string} projectId - Project ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Project assignments
   */
  static async getAssignments (projectId, startDate, endDate) {
    try {
      const assignmentsQuery = `
        SELECT 
          a.assignment_id,
          a.assignment_date,
          a.employee_id,
          e.name as employee_name,
          e.position_id,
          p.name as position_name,
          p.code as position_code,
          p.color_code as position_color,
          a.notes,
          a.created_at
        FROM assignments a
        JOIN employees e ON a.employee_id = e.employee_id
        JOIN positions p ON e.position_id = p.position_id
        WHERE a.project_id = $1 
          AND a.assignment_date >= $2 
          AND a.assignment_date <= $3
        ORDER BY a.assignment_date, e.name
      `

      const result = await query(assignmentsQuery, [projectId, startDate, endDate])
      return result.rows
    } catch (error) {
      logger.error(`Error getting assignments for project ${projectId}:`, error)
      throw error
    }
  }

  /**
   * Get project statistics
   * @param {string} projectId - Project ID (optional, for specific project stats)
   * @returns {Promise<Object>} Project statistics
   */
  static async getStatistics (projectId = null) {
    try {
      if (projectId) {
        // Statistics for specific project
        const projectStatsQuery = `
          SELECT 
            p.project_id,
            p.name,
            p.status,
            COUNT(DISTINCT a.employee_id) as total_employees_assigned,
            COUNT(a.assignment_id) as total_assignments,
            COUNT(CASE WHEN a.assignment_date = CURRENT_DATE THEN 1 END) as current_assignments,
            MIN(a.assignment_date) as first_assignment_date,
            MAX(a.assignment_date) as last_assignment_date
          FROM projects p
          LEFT JOIN assignments a ON p.project_id = a.project_id
          WHERE p.project_id = $1
          GROUP BY p.project_id, p.name, p.status
        `

        const result = await query(projectStatsQuery, [projectId])
        return result.rows[0] || null
      } else {
        // Overall project statistics
        const overallStatsQuery = `
          SELECT 
            COUNT(*) as total_projects,
            COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_projects,
            COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_projects,
            COUNT(CASE WHEN status = 'On Hold' THEN 1 END) as on_hold_projects,
            COUNT(CASE WHEN status = 'Planned' THEN 1 END) as planned_projects
          FROM projects
        `

        const result = await query(overallStatsQuery)
        return result.rows[0]
      }
    } catch (error) {
      logger.error('Error getting project statistics:', error)
      throw error
    }
  }

  /**
   * Search projects by name or number
   * @param {string} searchTerm - Search term
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Array>} Matching projects
   */
  static async search (searchTerm, limit = 20) {
    try {
      const searchQuery = `
        SELECT 
          p.project_id,
          p.name,
          p.number,
          p.status,
          p.location,
          u.first_name || ' ' || u.last_name as manager_name
        FROM projects p
        LEFT JOIN users u ON p.manager_id = u.user_id
        WHERE (
          p.name ILIKE $1 OR 
          p.number ILIKE $1 OR 
          p.project_id ILIKE $1
        )
        ORDER BY 
          CASE 
            WHEN p.name ILIKE $2 THEN 1
            WHEN p.number ILIKE $2 THEN 2
            ELSE 3
          END,
          p.name
        LIMIT $3
      `

      const searchPattern = `%${searchTerm}%`
      const exactPattern = `${searchTerm}%`

      const result = await query(searchQuery, [searchPattern, exactPattern, limit])
      return result.rows
    } catch (error) {
      logger.error(`Error searching projects with term "${searchTerm}":`, error)
      throw error
    }
  }
}

module.exports = Project
