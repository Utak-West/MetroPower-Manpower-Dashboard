/**
 * Calendar Routes
 *
 * Handles calendar-related endpoints for the MetroPower Dashboard API
 * with comprehensive error handling and demo mode support.
 *
 * Copyright 2025 The HigherSelf Network
 */

const express = require('express')
const { asyncHandler } = require('../middleware/errorHandler')
const logger = require('../utils/logger')

const router = express.Router()

/**
 * @route   GET /api/calendar/month/:year/:month
 * @desc    Get calendar data for a specific month
 * @access  Private
 */
router.get('/month/:year/:month', asyncHandler(async (req, res) => {
  try {
    const { year, month } = req.params
    
    // Validate year and month
    const yearNum = parseInt(year)
    const monthNum = parseInt(month)
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        error: 'Invalid parameters',
        message: 'Year and month must be valid numbers'
      })
    }

    // Calculate date range for the month
    const startDate = new Date(yearNum, monthNum - 1, 1)
    const endDate = new Date(yearNum, monthNum, 0) // Last day of month

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const assignments = await demoService.getAssignments()
      
      // Filter assignments for the month
      const monthAssignments = assignments.filter(a => {
        const assignmentDate = new Date(a.date)
        return assignmentDate >= startDate && assignmentDate <= endDate
      })

      // Group assignments by date
      const calendarData = {}
      monthAssignments.forEach(assignment => {
        const dateKey = assignment.date
        if (!calendarData[dateKey]) {
          calendarData[dateKey] = []
        }
        calendarData[dateKey].push(assignment)
      })

      return res.json({
        success: true,
        data: {
          year: yearNum,
          month: monthNum,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          assignments: calendarData,
          totalAssignments: monthAssignments.length
        },
        isDemoMode: true
      })
    }

    // Database mode implementation would go here
    res.json({
      success: true,
      data: {
        year: yearNum,
        month: monthNum,
        assignments: {},
        totalAssignments: 0
      }
    })
  } catch (error) {
    logger.error('Error fetching calendar month data:', error)
    res.status(500).json({
      error: 'Calendar month error',
      message: 'Failed to fetch calendar month data'
    })
  }
}))

/**
 * @route   GET /api/calendar/week/:date
 * @desc    Get calendar data for a specific week
 * @access  Private
 */
router.get('/week/:date', asyncHandler(async (req, res) => {
  try {
    const { date } = req.params
    
    // Parse and validate date
    const targetDate = new Date(date)
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date',
        message: 'Date must be in YYYY-MM-DD format'
      })
    }

    // Calculate week start (Monday) and end (Sunday)
    const weekStart = new Date(targetDate)
    weekStart.setDate(targetDate.getDate() - targetDate.getDay() + 1)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const weekAssignments = await demoService.getWeekAssignments(weekStart.toISOString().split('T')[0])

      return res.json({
        success: true,
        data: {
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: weekEnd.toISOString().split('T')[0],
          assignments: weekAssignments
        },
        isDemoMode: true
      })
    }

    // Database mode implementation would go here
    res.json({
      success: true,
      data: {
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        assignments: {}
      }
    })
  } catch (error) {
    logger.error('Error fetching calendar week data:', error)
    res.status(500).json({
      error: 'Calendar week error',
      message: 'Failed to fetch calendar week data'
    })
  }
}))

/**
 * @route   GET /api/calendar/conflicts/:date
 * @desc    Check for assignment conflicts on a specific date
 * @access  Private
 */
router.get('/conflicts/:date', asyncHandler(async (req, res) => {
  try {
    const { date } = req.params
    
    // Parse and validate date
    const targetDate = new Date(date)
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date',
        message: 'Date must be in YYYY-MM-DD format'
      })
    }

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const assignments = await demoService.getAssignments()
      
      // Find assignments for the specific date
      const dateAssignments = assignments.filter(a => a.date === date)
      
      // Check for conflicts (employees assigned to multiple projects on same date)
      const employeeAssignments = {}
      const conflicts = []
      
      dateAssignments.forEach(assignment => {
        const employeeId = assignment.employee_id
        if (!employeeAssignments[employeeId]) {
          employeeAssignments[employeeId] = []
        }
        employeeAssignments[employeeId].push(assignment)
      })
      
      // Identify conflicts
      Object.entries(employeeAssignments).forEach(([employeeId, assignments]) => {
        if (assignments.length > 1) {
          conflicts.push({
            employee_id: employeeId,
            employee: assignments[0].employee,
            assignments: assignments
          })
        }
      })

      return res.json({
        success: true,
        data: {
          date,
          conflicts,
          conflictCount: conflicts.length,
          totalAssignments: dateAssignments.length
        },
        isDemoMode: true
      })
    }

    // Database mode implementation would go here
    res.json({
      success: true,
      data: {
        date,
        conflicts: [],
        conflictCount: 0,
        totalAssignments: 0
      }
    })
  } catch (error) {
    logger.error('Error checking calendar conflicts:', error)
    res.status(500).json({
      error: 'Calendar conflicts error',
      message: 'Failed to check calendar conflicts'
    })
  }
}))

module.exports = router
