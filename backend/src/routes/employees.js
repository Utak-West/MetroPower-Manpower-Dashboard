/**
 * Employee Routes
 *
 * Handles employee management endpoints for the MetroPower Dashboard API
 * with comprehensive error handling and demo mode support.
 *
 * Copyright 2025 The HigherSelf Network
 */

const express = require('express')
const { asyncHandler } = require('../middleware/errorHandler')
const { requireManager } = require('../middleware/auth')
const logger = require('../utils/logger')

const router = express.Router()

/**
 * @route   GET /api/employees
 * @desc    Get all employees
 * @access  Private
 */
router.get('/', asyncHandler(async (req, res) => {
  try {
    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const employees = await demoService.getEmployees()

      return res.json({
        success: true,
        data: employees,
        isDemoMode: true
      })
    }

    // Use persistent database operations
    const Employee = require('../models/Employee')
    const result = await Employee.getAll()

    res.json({
      success: true,
      data: result.employees || [],
      pagination: result.pagination
    })
  } catch (error) {
    logger.error('Error fetching employees:', error)
    res.status(500).json({
      error: 'Employee fetch error',
      message: 'Failed to fetch employees'
    })
  }
}))

/**
 * @route   GET /api/employees/unassigned/:date
 * @desc    Get unassigned employees for specific date
 * @access  Private
 */
router.get('/unassigned/:date', asyncHandler(async (req, res) => {
  try {
    const { date } = req.params

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Date must be in YYYY-MM-DD format'
      })
    }

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const unassignedEmployees = await demoService.getUnassignedEmployees(date)

      return res.json({
        success: true,
        data: unassignedEmployees,
        isDemoMode: true
      })
    }

    // Use persistent database operations
    const Employee = require('../models/Employee')
    const unassignedEmployees = await Employee.getUnassignedForDate(date)

    res.json({
      success: true,
      data: unassignedEmployees
    })
  } catch (error) {
    logger.error('Error fetching unassigned employees:', error)
    res.status(500).json({
      error: 'Unassigned employees error',
      message: 'Failed to fetch unassigned employees'
    })
  }
}))

/**
 * @route   POST /api/employees
 * @desc    Create new employee
 * @access  Private (Manager+)
 */
router.post('/', requireManager, asyncHandler(async (req, res) => {
  try {
    const employeeData = req.body

    // Basic validation
    const requiredFields = ['first_name', 'last_name', 'trade', 'level', 'hourly_rate']
    const missingFields = requiredFields.filter(field => !employeeData[field])

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: `Missing required fields: ${missingFields.join(', ')}`
      })
    }

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const newEmployee = await demoService.addEmployee(employeeData)

      return res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: newEmployee,
        isDemoMode: true
      })
    }

    // Use persistent database operations
    const Employee = require('../models/Employee')
    const newEmployee = await Employee.create(employeeData, req.user.user_id)

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: newEmployee
    })
  } catch (error) {
    logger.error('Error creating employee:', error)
    res.status(500).json({
      error: 'Employee creation error',
      message: 'Failed to create employee'
    })
  }
}))

/**
 * @route   PUT /api/employees/:id
 * @desc    Update employee
 * @access  Private (Manager+)
 */
router.put('/:id', requireManager, asyncHandler(async (req, res) => {
  try {
    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const updatedEmployee = await demoService.updateEmployee(req.params.id, req.body)

      if (!updatedEmployee) {
        return res.status(404).json({
          error: 'Employee not found',
          message: 'Employee not found for update'
        })
      }

      return res.json({
        success: true,
        message: 'Employee updated successfully',
        data: updatedEmployee,
        isDemoMode: true
      })
    }

    // Use persistent database operations
    const Employee = require('../models/Employee')
    const updatedEmployee = await Employee.update(req.params.id, req.body, req.user.user_id)

    if (!updatedEmployee) {
      return res.status(404).json({
        error: 'Employee not found',
        message: 'Employee not found for update'
      })
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    })
  } catch (error) {
    logger.error('Error updating employee:', error)
    res.status(500).json({
      error: 'Employee update error',
      message: 'Failed to update employee'
    })
  }
}))

/**
 * @route   DELETE /api/employees/:id
 * @desc    Delete employee (soft delete)
 * @access  Private (Manager+)
 */
router.delete('/:id', requireManager, asyncHandler(async (req, res) => {
  try {
    if (global.isDemoMode) {
      return res.status(501).json({
        error: 'Not implemented',
        message: 'Employee deletion not available in demo mode'
      })
    }

    // Use persistent database operations
    const Employee = require('../models/Employee')
    const deleted = await Employee.delete(req.params.id, req.user.user_id)

    if (!deleted) {
      return res.status(404).json({
        error: 'Employee not found',
        message: 'Employee not found for deletion'
      })
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    })
  } catch (error) {
    logger.error('Error deleting employee:', error)
    res.status(500).json({
      error: 'Employee deletion error',
      message: 'Failed to delete employee'
    })
  }
}))

module.exports = router
