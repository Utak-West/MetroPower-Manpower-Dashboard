/**
 * Project Routes
 *
 * Handles project management endpoints for the MetroPower Dashboard API
 * with comprehensive error handling and demo mode support.
 *
 * Copyright 2025 The HigherSelf Network
 */

const express = require('express')
const { asyncHandler } = require('../middleware/errorHandler')
const logger = require('../utils/logger')

const router = express.Router()

/**
 * @route   GET /api/projects
 * @desc    Get all projects
 * @access  Private
 */
router.get('/', asyncHandler(async (req, res) => {
  try {
    const { withStats } = req.query

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const projects = withStats === 'true'
        ? await demoService.getProjectsWithStats()
        : await demoService.getProjects()

      return res.json({
        success: true,
        data: projects,
        isDemoMode: true
      })
    }

    // Use persistent database operations
    const Project = require('../models/Project')
    const projects = withStats === 'true'
      ? await Project.getAllWithStats()
      : await Project.getAll()

    res.json({
      success: true,
      data: projects
    })
  } catch (error) {
    logger.error('Error fetching projects:', error)
    res.status(500).json({
      error: 'Project fetch error',
      message: 'Failed to fetch projects'
    })
  }
}))

/**
 * @route   GET /api/projects/active
 * @desc    Get active projects
 * @access  Private
 */
router.get('/active', asyncHandler(async (req, res) => {
  try {
    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const activeProjects = await demoService.getActiveProjects()

      return res.json({
        success: true,
        data: activeProjects,
        isDemoMode: true
      })
    }

    // Database mode implementation would go here
    // For now, fallback to demo service
    const demoService = require('../services/demoService')
    const activeProjects = await demoService.getActiveProjects()

    res.json({
      success: true,
      data: activeProjects
    })
  } catch (error) {
    logger.error('Error fetching active projects:', error)
    res.status(500).json({
      error: 'Active projects error',
      message: 'Failed to fetch active projects'
    })
  }
}))

/**
 * @route   GET /api/projects/:id
 * @desc    Get project details by ID
 * @access  Private
 */
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const projectId = req.params.id

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const projects = await demoService.getProjects()
      const project = projects.find(p => p.project_id.toString() === projectId)

      if (!project) {
        return res.status(404).json({
          error: 'Project not found',
          message: `Project with ID ${projectId} not found`
        })
      }

      // Get project assignments for the current week
      const today = new Date()
      const weekStart = new Date(today.setDate(today.getDate() - today.getDay() + 1))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const weekAssignments = await demoService.getWeekAssignments(weekStart.toISOString().split('T')[0])
      const projectAssignments = weekAssignments
        .flatMap(day => day.assignments)
        .filter(a => a.project_id && a.project_id.toString() === projectId)

      return res.json({
        success: true,
        data: {
          ...project,
          currentAssignments: projectAssignments,
          assignmentCount: projectAssignments.length
        },
        isDemoMode: true
      })
    }

    // Database mode implementation would go here
    // For now, fallback to demo service
    const demoService = require('../services/demoService')
    const projects = await demoService.getProjects()
    const project = projects.find(p => p.project_id.toString() === projectId)

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        message: `Project with ID ${projectId} not found`
      })
    }

    res.json({
      success: true,
      data: project
    })
  } catch (error) {
    logger.error('Error fetching project details:', error)
    res.status(500).json({
      error: 'Project details error',
      message: 'Failed to fetch project details'
    })
  }
}))

/**
 * @route   GET /api/projects/:id/assignments
 * @desc    Get project assignments for a date range
 * @access  Private
 */
router.get('/:id/assignments', asyncHandler(async (req, res) => {
  try {
    const projectId = req.params.id
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'startDate and endDate are required'
      })
    }

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const assignments = await demoService.getAssignments()

      const projectAssignments = assignments.filter(a =>
        a.project_id.toString() === projectId &&
        a.date >= startDate &&
        a.date <= endDate
      )

      return res.json({
        success: true,
        data: projectAssignments,
        isDemoMode: true
      })
    }

    // Database mode implementation would go here
    res.json({
      success: true,
      data: []
    })
  } catch (error) {
    logger.error('Error fetching project assignments:', error)
    res.status(500).json({
      error: 'Project assignments error',
      message: 'Failed to fetch project assignments'
    })
  }
}))

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private (Manager only)
 */
router.post('/', asyncHandler(async (req, res) => {
  try {
    // Check if user is authenticated and has manager role
    if (!req.user || !['Project Manager', 'Admin', 'Super Admin'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only managers can create projects'
      })
    }

    const {
      name,
      description,
      project_id,
      location,
      start_date,
      end_date,
      budget,
      status,
      project_manager,
      notes
    } = req.body

    // Validate required fields
    if (!name || !location || !start_date) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Name, location, and start date are required'
      })
    }

    // Validate dates
    if (end_date && new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Start date cannot be after end date'
      })
    }

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')

      // Generate project ID if not provided
      const generatedId = project_id || `PRJ-${Date.now()}`

      const newProject = {
        project_id: generatedId,
        name: name.trim(),
        description: description?.trim() || '',
        location: location.trim(),
        start_date,
        end_date: end_date || null,
        budget: budget || null,
        status: status || 'Active',
        project_manager: project_manager || req.user.first_name + ' ' + req.user.last_name,
        notes: notes?.trim() || '',
        created_at: new Date().toISOString(),
        created_by: req.user.user_id
      }

      // Add to demo data
      const success = await demoService.addProject(newProject)

      if (!success) {
        return res.status(500).json({
          error: 'Creation failed',
          message: 'Failed to create project'
        })
      }

      logger.info(`Project created: ${generatedId} by user ${req.user.user_id}`)

      return res.status(201).json({
        success: true,
        data: newProject,
        message: 'Project created successfully',
        isDemoMode: true
      })
    }

    // Database mode implementation would go here
    res.status(501).json({
      error: 'Not implemented',
      message: 'Database mode not yet implemented'
    })
  } catch (error) {
    logger.error('Error creating project:', error)
    res.status(500).json({
      error: 'Project creation error',
      message: 'Failed to create project'
    })
  }
}))

/**
 * @route   PUT /api/projects/:id
 * @desc    Update an existing project
 * @access  Private (Manager only)
 */
router.put('/:id', asyncHandler(async (req, res) => {
  try {
    // Check if user is authenticated and has manager role
    if (!req.user || !['Project Manager', 'Admin', 'Super Admin'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only managers can update projects'
      })
    }

    const projectId = req.params.id
    const {
      name,
      description,
      location,
      start_date,
      end_date,
      budget,
      status,
      project_manager,
      notes
    } = req.body

    // Validate required fields
    if (!name || !location || !start_date) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Name, location, and start date are required'
      })
    }

    // Validate dates
    if (end_date && new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Start date cannot be after end date'
      })
    }

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')

      const updatedProject = {
        project_id: projectId,
        name: name.trim(),
        description: description?.trim() || '',
        location: location.trim(),
        start_date,
        end_date: end_date || null,
        budget: budget || null,
        status: status || 'Active',
        project_manager: project_manager || req.user.first_name + ' ' + req.user.last_name,
        notes: notes?.trim() || '',
        updated_at: new Date().toISOString(),
        updated_by: req.user.user_id
      }

      const success = await demoService.updateProject(projectId, updatedProject)

      if (!success) {
        return res.status(404).json({
          error: 'Project not found',
          message: `Project with ID ${projectId} not found`
        })
      }

      logger.info(`Project updated: ${projectId} by user ${req.user.user_id}`)

      return res.json({
        success: true,
        data: updatedProject,
        message: 'Project updated successfully',
        isDemoMode: true
      })
    }

    // Database mode implementation would go here
    res.status(501).json({
      error: 'Not implemented',
      message: 'Database mode not yet implemented'
    })
  } catch (error) {
    logger.error('Error updating project:', error)
    res.status(500).json({
      error: 'Project update error',
      message: 'Failed to update project'
    })
  }
}))

module.exports = router
