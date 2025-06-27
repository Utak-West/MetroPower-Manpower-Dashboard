/**
 * Position Routes
 *
 * Handles position/trade management endpoints for the MetroPower Dashboard API
 *
 * Copyright 2025 The HigherSelf Network
 */

const express = require('express')
const { asyncHandler } = require('../middleware/errorHandler')
const { authenticate } = require('../middleware/auth')
const { query } = require('../config/database')
const logger = require('../utils/logger')

const router = express.Router()

/**
 * @route   GET /api/positions
 * @desc    Get all positions/trades
 * @access  Private
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  try {
    if (global.isDemoMode) {
      // Return hardcoded positions for demo mode
      const positions = [
        { position_id: 1, name: 'Electrician', code: 'EL', color_code: '#28A745', description: 'Licensed electrician' },
        { position_id: 2, name: 'Field Supervisor', code: 'FS', color_code: '#3B5998', description: 'Field operations supervisor' },
        { position_id: 3, name: 'Apprentice', code: 'AP', color_code: '#F7B731', description: 'Electrical apprentice' },
        { position_id: 4, name: 'General Laborer', code: 'GL', color_code: '#6F42C1', description: 'General construction laborer' },
        { position_id: 5, name: 'Temp', code: 'TM', color_code: '#E52822', description: 'Temporary worker' }
      ]

      return res.json({
        success: true,
        data: positions,
        isDemoMode: true
      })
    }

    // Database mode implementation
    const result = await query(`
      SELECT 
        position_id,
        name,
        code,
        color_code,
        description,
        created_at,
        updated_at
      FROM positions
      ORDER BY name
    `)

    res.json({
      success: true,
      data: result.rows,
      isDemoMode: false
    })
  } catch (error) {
    logger.error('Error fetching positions:', error)
    res.status(500).json({
      error: 'Position fetch error',
      message: 'Failed to fetch positions'
    })
  }
}))

/**
 * @route   GET /api/positions/:id
 * @desc    Get single position by ID
 * @access  Private
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid position ID'
      })
    }

    if (global.isDemoMode) {
      const positions = [
        { position_id: 1, name: 'Electrician', code: 'EL', color_code: '#28A745', description: 'Licensed electrician' },
        { position_id: 2, name: 'Field Supervisor', code: 'FS', color_code: '#3B5998', description: 'Field operations supervisor' },
        { position_id: 3, name: 'Apprentice', code: 'AP', color_code: '#F7B731', description: 'Electrical apprentice' },
        { position_id: 4, name: 'General Laborer', code: 'GL', color_code: '#6F42C1', description: 'General construction laborer' },
        { position_id: 5, name: 'Temp', code: 'TM', color_code: '#E52822', description: 'Temporary worker' }
      ]

      const position = positions.find(p => p.position_id === parseInt(id))

      if (!position) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Position not found'
        })
      }

      return res.json({
        success: true,
        data: position,
        isDemoMode: true
      })
    }

    // Database mode implementation
    const result = await query(`
      SELECT 
        position_id,
        name,
        code,
        color_code,
        description,
        created_at,
        updated_at
      FROM positions
      WHERE position_id = $1
    `, [parseInt(id)])

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Position not found'
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
      isDemoMode: false
    })
  } catch (error) {
    logger.error('Error fetching position:', error)
    res.status(500).json({
      error: 'Position fetch error',
      message: 'Failed to fetch position'
    })
  }
}))

/**
 * @route   GET /api/positions/:id/employees
 * @desc    Get employees for a specific position
 * @access  Private
 */
router.get('/:id/employees', authenticate, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid position ID'
      })
    }

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const employees = await demoService.getEmployees()
      
      // Filter employees by position
      const positionEmployees = employees.filter(emp => {
        // Handle both position_id and position name matching
        return emp.position_id === parseInt(id) || 
               (emp.position && getPositionNameById(parseInt(id)) === emp.position)
      })

      return res.json({
        success: true,
        data: positionEmployees,
        count: positionEmployees.length,
        isDemoMode: true
      })
    }

    // Database mode implementation
    const result = await query(`
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
      JOIN positions p ON e.position_id = p.position_id
      WHERE e.position_id = $1
      ORDER BY e.name
    `, [parseInt(id)])

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      isDemoMode: false
    })
  } catch (error) {
    logger.error('Error fetching employees for position:', error)
    res.status(500).json({
      error: 'Employee fetch error',
      message: 'Failed to fetch employees for position'
    })
  }
}))

/**
 * Helper function to get position name by ID
 */
function getPositionNameById(positionId) {
  const positions = {
    1: 'Electrician',
    2: 'Field Supervisor',
    3: 'Apprentice',
    4: 'General Laborer',
    5: 'Temp'
  }
  return positions[positionId] || 'Unknown'
}

module.exports = router
