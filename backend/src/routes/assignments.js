/**
 * Assignment Routes
 *
 * Handles assignment management endpoints for the MetroPower Dashboard API
 * with comprehensive error handling and demo mode support.
 *
 * Copyright 2025 The HigherSelf Network
 */

const express = require('express')
const { asyncHandler } = require('../middleware/errorHandler')
const { requireManager, authenticate } = require('../middleware/auth')
const Assignment = require('../models/Assignment')
const logger = require('../utils/logger')

const router = express.Router()

/**
 * @route   GET /api/assignments
 * @desc    Get all assignments
 * @access  Private
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  try {
    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const assignments = await demoService.getAssignments()

      return res.json({
        success: true,
        data: assignments,
        isDemoMode: true
      })
    }

    // Database mode implementation
    const { startDate, endDate, project_id, employee_id } = req.query

    // Default to current week if no date range provided
    const today = new Date()
    const defaultStartDate = startDate || new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()).toISOString().split('T')[0]
    const defaultEndDate = endDate || new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6).toISOString().split('T')[0]

    const filters = {}
    if (project_id) filters.project_id = project_id
    if (employee_id) filters.employee_id = employee_id

    const assignments = await Assignment.getByDateRange(defaultStartDate, defaultEndDate, filters)

    res.json({
      success: true,
      data: assignments,
      isDemoMode: false
    })
  } catch (error) {
    logger.error('Error fetching assignments:', error)
    res.status(500).json({
      error: 'Assignment fetch error',
      message: 'Failed to fetch assignments'
    })
  }
}))

/**
 * @route   GET /api/assignments/:id
 * @desc    Get single assignment by ID
 * @access  Private
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params

    // Validate assignment ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid assignment ID'
      })
    }

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const assignments = await demoService.getAssignments()
      const assignment = assignments.find(a => a.assignment_id === parseInt(id))

      if (!assignment) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Assignment not found'
        })
      }

      return res.json({
        success: true,
        data: assignment,
        isDemoMode: true
      })
    }

    // Database mode implementation
    // For now, we'll use the getByDateRange method with a wide range and filter by ID
    // In a full implementation, you might want to add a getById method to the Assignment model
    const startDate = '2020-01-01'
    const endDate = '2030-12-31'
    const assignments = await Assignment.getByDateRange(startDate, endDate)
    const assignment = assignments.find(a => a.assignment_id === parseInt(id))

    if (!assignment) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Assignment not found'
      })
    }

    res.json({
      success: true,
      data: assignment,
      isDemoMode: false
    })
  } catch (error) {
    logger.error('Error fetching assignment:', error)
    res.status(500).json({
      error: 'Assignment fetch error',
      message: 'Failed to fetch assignment'
    })
  }
}))

/**
 * @route   POST /api/assignments
 * @desc    Create new assignment
 * @access  Private (Manager+)
 */
router.post('/', requireManager, asyncHandler(async (req, res) => {
  try {
    const assignmentData = req.body

    // Basic validation for MVP fields
    const requiredFields = ['employee_id', 'project_id', 'assignment_date']
    const missingFields = requiredFields.filter(field => !assignmentData[field])

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: `Missing required fields: ${missingFields.join(', ')}`
      })
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(assignmentData.assignment_date)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'assignment_date must be in YYYY-MM-DD format'
      })
    }

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const assignment = await demoService.createAssignment(assignmentData)

      return res.status(201).json({
        success: true,
        data: assignment,
        isDemoMode: true
      })
    }

    // Database mode implementation
    const assignment = await Assignment.create(assignmentData, req.user.user_id)

    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully',
      isDemoMode: false
    })
  } catch (error) {
    logger.error('Error creating assignment:', error)

    // Handle specific error types
    if (error.message.includes('already assigned')) {
      return res.status(409).json({
        error: 'Conflict error',
        message: error.message
      })
    }

    res.status(500).json({
      error: 'Assignment creation error',
      message: 'Failed to create assignment'
    })
  }
}))

/**
 * @route   PUT /api/assignments/:id
 * @desc    Update assignment
 * @access  Private (Manager+)
 */
router.put('/:id', requireManager, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // Validate assignment ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid assignment ID'
      })
    }

    // Validate date format if provided
    if (updateData.assignment_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(updateData.assignment_date)) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'assignment_date must be in YYYY-MM-DD format'
        })
      }
    }

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const assignment = await demoService.updateAssignment(parseInt(id), updateData)

      return res.json({
        success: true,
        data: assignment,
        isDemoMode: true
      })
    }

    // Database mode implementation
    const assignment = await Assignment.update(parseInt(id), updateData, req.user.user_id)

    res.json({
      success: true,
      data: assignment,
      message: 'Assignment updated successfully',
      isDemoMode: false
    })
  } catch (error) {
    logger.error('Error updating assignment:', error)

    // Handle specific error types
    if (error.message === 'Assignment not found') {
      return res.status(404).json({
        error: 'Not found',
        message: 'Assignment not found'
      })
    }

    if (error.message.includes('already assigned')) {
      return res.status(409).json({
        error: 'Conflict error',
        message: error.message
      })
    }

    res.status(500).json({
      error: 'Assignment update error',
      message: 'Failed to update assignment'
    })
  }
}))

/**
 * @route   DELETE /api/assignments/:id
 * @desc    Delete assignment
 * @access  Private (Manager+)
 */
router.delete('/:id', requireManager, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params

    // Validate assignment ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid assignment ID'
      })
    }

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      await demoService.deleteAssignment(parseInt(id))

      return res.json({
        success: true,
        message: 'Assignment deleted successfully',
        isDemoMode: true
      })
    }

    // Database mode implementation
    await Assignment.delete(parseInt(id), req.user.user_id)

    res.json({
      success: true,
      message: 'Assignment deleted successfully',
      isDemoMode: false
    })
  } catch (error) {
    logger.error('Error deleting assignment:', error)

    // Handle specific error types
    if (error.message === 'Assignment not found') {
      return res.status(404).json({
        error: 'Not found',
        message: 'Assignment not found'
      })
    }

    res.status(500).json({
      error: 'Assignment deletion error',
      message: 'Failed to delete assignment'
    })
  }
}))

module.exports = router
