/**
 * Dashboard Routes
 *
 * Handles dashboard data endpoints for the MetroPower Dashboard API
 * with comprehensive error handling and demo mode support.
 *
 * Copyright 2025 The HigherSelf Network
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/dashboard/current
 * @desc    Get current dashboard data
 * @access  Private
 */
router.get('/current', asyncHandler(async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Calculate current week start (Monday)
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);
    const weekStartDate = monday.toISOString().split('T')[0];

    if (global.isDemoMode) {
      const demoService = require('../services/demoService');

      const [
        unassignedToday,
        activeProjects,
        weekAssignments,
        metrics
      ] = await Promise.all([
        demoService.getUnassignedEmployees(todayStr),
        demoService.getActiveProjects(),
        demoService.getWeekAssignments(weekStartDate),
        demoService.getDashboardMetrics()
      ]);

      return res.json({
        success: true,
        data: {
          weekStart: weekStartDate,
          currentDate: todayStr,
          unassignedToday,
          activeProjects,
          weekAssignments,
          employeeStatistics: {
            total: metrics.totalEmployees,
            assigned: metrics.todayAssignments,
            unassigned: metrics.unassignedToday.length
          },
          projectStatistics: {
            active: metrics.activeProjects,
            total: metrics.activeProjects
          }
        },
        isDemoMode: true
      });
    }

    // Database mode implementation would go here
    // For now, fallback to demo service
    const demoService = require('../services/demoService');

    const [
      unassignedToday,
      activeProjects,
      weekAssignments,
      metrics
    ] = await Promise.all([
      demoService.getUnassignedEmployees(todayStr),
      demoService.getActiveProjects(),
      demoService.getWeekAssignments(weekStartDate),
      demoService.getDashboardMetrics()
    ]);

    res.json({
      success: true,
      data: {
        weekStart: weekStartDate,
        currentDate: todayStr,
        unassignedToday,
        activeProjects,
        weekAssignments,
        employeeStatistics: {
          total: metrics.totalEmployees,
          assigned: metrics.todayAssignments,
          unassigned: metrics.unassignedToday.length
        },
        projectStatistics: {
          active: metrics.activeProjects,
          total: metrics.activeProjects
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'Dashboard data error',
      message: 'Failed to fetch dashboard data'
    });
  }
}));

/**
 * @route   GET /api/dashboard/metrics
 * @desc    Get key performance metrics for dashboard
 * @access  Private
 */
router.get('/metrics', asyncHandler(async (req, res) => {
  try {
    if (global.isDemoMode) {
      const demoService = require('../services/demoService');
      const metrics = await demoService.getDashboardMetrics();

      return res.json({
        success: true,
        data: metrics,
        isDemoMode: true
      });
    }

    // Database mode implementation would go here
    // For now, fallback to demo service
    const demoService = require('../services/demoService');
    const metrics = await demoService.getDashboardMetrics();

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    logger.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      error: 'Metrics error',
      message: 'Failed to fetch dashboard metrics'
    });
  }
}));

/**
 * @route   GET /api/dashboard/week/:date
 * @desc    Get weekly assignment data for specific date
 * @access  Private
 */
router.get('/week/:date', asyncHandler(async (req, res) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Date must be in YYYY-MM-DD format'
      });
    }

    if (global.isDemoMode) {
      const demoService = require('../services/demoService');
      const weekAssignments = await demoService.getWeekAssignments(date);

      return res.json({
        success: true,
        data: {
          weekStart: date,
          assignments: weekAssignments
        },
        isDemoMode: true
      });
    }

    // Database mode implementation would go here
    // For now, fallback to demo service
    const demoService = require('../services/demoService');
    const weekAssignments = await demoService.getWeekAssignments(date);

    res.json({
      success: true,
      data: {
        weekStart: date,
        assignments: weekAssignments
      }
    });

  } catch (error) {
    logger.error('Error fetching weekly data:', error);
    res.status(500).json({
      error: 'Weekly data error',
      message: 'Failed to fetch weekly assignment data'
    });
  }
}));

/**
 * @route   GET /api/dashboard/health
 * @desc    Get dashboard health status
 * @access  Private
 */
router.get('/health', asyncHandler(async (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: global.isDemoMode ? 'demo' : 'connected',
      services: {
        authentication: 'operational',
        dashboard: 'operational',
        logging: 'operational'
      }
    };

    if (global.isDemoMode) {
      healthStatus.mode = 'demo';
      healthStatus.message = 'Running in demonstration mode with in-memory data';
    }

    res.json({
      success: true,
      data: healthStatus
    });

  } catch (error) {
    logger.error('Error checking dashboard health:', error);
    res.status(500).json({
      error: 'Health check error',
      message: 'Failed to check dashboard health'
    });
  }
}));

module.exports = router;
