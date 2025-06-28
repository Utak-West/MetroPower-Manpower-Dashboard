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

    // Database mode implementation would go here
    // For now, fallback to demo service
    const demoService = require('../services/demoService')
    const projects = withStats === 'true'
      ? await demoService.getProjectsWithStats()
      : await demoService.getProjects()

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
      const projectAssignments = Object.values(weekAssignments).flat().filter(a => a.project_id.toString() === projectId)

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

module.exports = router
