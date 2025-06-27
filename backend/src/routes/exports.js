/**
 * Export Routes
 *
 * Handles data export endpoints for the MetroPower Dashboard API
 *
 * Copyright 2025 The HigherSelf Network
 */

const express = require('express')
const { asyncHandler } = require('../middleware/errorHandler')
const logger = require('../utils/logger')

const router = express.Router()

/**
 * Convert data to CSV format
 */
function convertToCSV(data, headers) {
  if (!data || data.length === 0) {
    return headers.join(',') + '\n'
  }

  const csvRows = []
  csvRows.push(headers.join(','))

  data.forEach(row => {
    const values = headers.map(header => {
      const key = header.toLowerCase().replace(/\s+/g, '_')
      let value = row[key] || ''

      // Handle nested objects
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value)
      }

      // Escape CSV values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        value = `"${value.replace(/"/g, '""')}"`
      }

      return value
    })
    csvRows.push(values.join(','))
  })

  return csvRows.join('\n')
}

/**
 * @route   GET /api/exports/assignments
 * @desc    Export assignments data
 * @access  Private
 */
router.get('/assignments', asyncHandler(async (req, res) => {
  try {
    const { format = 'csv' } = req.query

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const assignments = await demoService.getAssignments()

      // Prepare data for export
      const exportData = assignments.map(assignment => ({
        assignment_date: assignment.date,
        employee_name: assignment.employee ? `${assignment.employee.first_name} ${assignment.employee.last_name}` : 'Unknown',
        employee_position: assignment.employee ? assignment.employee.position : 'Unknown',
        project_name: assignment.project ? assignment.project.name : 'Unknown',
        project_location: assignment.project ? assignment.project.location : 'Unknown',
        task_description: assignment.task_description || '',
        location: assignment.location || '',
        notes: assignment.notes || '',
        status: assignment.status || 'Unknown'
      }))

      const headers = [
        'Assignment Date',
        'Employee Name',
        'Employee Position',
        'Project Name',
        'Project Location',
        'Task Description',
        'Location',
        'Notes',
        'Status'
      ]

      if (format === 'csv') {
        const csvContent = convertToCSV(exportData, headers)

        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', `attachment; filename="assignments_${new Date().toISOString().split('T')[0]}.csv"`)
        res.send(csvContent)
      } else {
        res.json({
          success: true,
          data: exportData,
          headers,
          count: exportData.length,
          isDemoMode: true
        })
      }

      logger.info('Assignments exported', {
        format,
        count: exportData.length,
        exported_by: req.user?.user_id
      })

      return
    }

    // Database mode implementation would go here
    res.status(501).json({
      error: 'Not implemented',
      message: 'Assignment export not yet implemented for database mode'
    })
  } catch (error) {
    logger.error('Error exporting assignments:', error)
    res.status(500).json({
      error: 'Export error',
      message: 'Failed to export assignments'
    })
  }
}))

/**
 * @route   GET /api/exports/employees
 * @desc    Export employees data
 * @access  Private
 */
router.get('/employees', asyncHandler(async (req, res) => {
  try {
    const { format = 'csv' } = req.query

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const employees = await demoService.getEmployees()

      const exportData = employees.map(employee => ({
        employee_id: employee.employee_id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone,
        position: employee.position,
        department: employee.department,
        hire_date: employee.hire_date,
        is_active: employee.is_active ? 'Active' : 'Inactive',
        skills: employee.skills ? employee.skills.join(', ') : ''
      }))

      const headers = [
        'Employee ID',
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Position',
        'Department',
        'Hire Date',
        'Status',
        'Skills'
      ]

      if (format === 'csv') {
        const csvContent = convertToCSV(exportData, headers)

        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', `attachment; filename="employees_${new Date().toISOString().split('T')[0]}.csv"`)
        res.send(csvContent)
      } else {
        res.json({
          success: true,
          data: exportData,
          headers,
          count: exportData.length,
          isDemoMode: true
        })
      }

      logger.info('Employees exported', {
        format,
        count: exportData.length,
        exported_by: req.user?.user_id
      })

      return
    }

    // Database mode implementation would go here
    res.status(501).json({
      error: 'Not implemented',
      message: 'Employee export not yet implemented for database mode'
    })
  } catch (error) {
    logger.error('Error exporting employees:', error)
    res.status(500).json({
      error: 'Export error',
      message: 'Failed to export employees'
    })
  }
}))

module.exports = router
