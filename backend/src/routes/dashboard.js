/**
 * Dashboard Routes
 * 
 * Handles dashboard-specific API endpoints for the MetroPower Dashboard.
 * Provides data for the main dashboard view, weekly assignments, and summary statistics.
 */

const express = require('express');
const { query, param, validationResult } = require('express-validator');
const Assignment = require('../models/Assignment');
const Employee = require('../models/Employee');
const Project = require('../models/Project');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/dashboard/current
 * @desc    Get current week dashboard data
 * @access  Private
 */
router.get('/current', asyncHandler(async (req, res) => {
  // Handle demo mode
  if (global.isDemoMode) {
    console.log('Dashboard: Demo mode detected');
    const demoService = require('../services/demoService');
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    console.log('Dashboard: Getting data for date:', todayStr);

    try {
      const dashboardData = await demoService.getDashboardData(todayStr);
      console.log('Dashboard: Data retrieved:', dashboardData);

      return res.json({
        message: 'Demo dashboard data retrieved successfully',
        data: {
          ...dashboardData,
          currentDate: todayStr,
          isDemoMode: true
        }
      });
    } catch (error) {
      console.error('Dashboard demo error:', error);
      throw error;
    }
  }

  // Calculate current week start (Monday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, Monday = 1
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysToMonday);
  const weekStartDate = monday.toISOString().split('T')[0];

  const weekData = await Assignment.getWeekAssignments(weekStartDate);

  // Get additional dashboard data
  const [activeProjects, employeeStats, unassignedToday] = await Promise.all([
    Project.getActive(),
    Employee.getStatistics(),
    Employee.getUnassigned(today.toISOString().split('T')[0])
  ]);

  res.json({
    message: 'Current week dashboard data retrieved successfully',
    data: {
      weekAssignments: weekData,
      activeProjects,
      employeeStatistics: employeeStats,
      unassignedToday,
      currentDate: today.toISOString().split('T')[0],
      weekStart: weekStartDate
    }
  });
}));

/**
 * @route   GET /api/dashboard/week/:date
 * @desc    Get dashboard data for specific week
 * @access  Private
 */
router.get('/week/:date', [
  param('date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const inputDate = new Date(req.params.date);
  
  // Calculate week start (Monday) from the given date
  const dayOfWeek = inputDate.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(inputDate);
  monday.setDate(inputDate.getDate() + daysToMonday);
  const weekStartDate = monday.toISOString().split('T')[0];

  const weekData = await Assignment.getWeekAssignments(weekStartDate);

  // Get active projects for the week
  const activeProjects = await Project.getActive();

  res.json({
    message: 'Week dashboard data retrieved successfully',
    data: {
      weekAssignments: weekData,
      activeProjects,
      requestedDate: req.params.date,
      weekStart: weekStartDate
    }
  });
}));

/**
 * @route   GET /api/dashboard/summary
 * @desc    Get dashboard summary statistics
 * @access  Private
 */
router.get('/summary', [
  query('startDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Start date must be in YYYY-MM-DD format'),
  query('endDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('End date must be in YYYY-MM-DD format')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  // Default to current week if no dates provided
  const today = new Date();
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  if (!startDate || !endDate) {
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    startDate = monday.toISOString().split('T')[0];
    endDate = friday.toISOString().split('T')[0];
  }

  // Get summary data
  const [
    assignments,
    employeeStats,
    projectStats,
    conflicts
  ] = await Promise.all([
    Assignment.getByDateRange(startDate, endDate),
    Employee.getStatistics(),
    Project.getStatistics(),
    Assignment.getConflicts(startDate, endDate)
  ]);

  // Calculate assignment statistics
  const assignmentStats = {
    totalAssignments: assignments.length,
    uniqueEmployees: new Set(assignments.map(a => a.employee_id)).size,
    uniqueProjects: new Set(assignments.map(a => a.project_id)).size,
    byDay: {},
    byProject: {},
    byPosition: {}
  };

  // Group assignments by day
  assignments.forEach(assignment => {
    const date = assignment.assignment_date;
    if (!assignmentStats.byDay[date]) {
      assignmentStats.byDay[date] = 0;
    }
    assignmentStats.byDay[date]++;

    // Group by project
    if (!assignmentStats.byProject[assignment.project_id]) {
      assignmentStats.byProject[assignment.project_id] = {
        project_name: assignment.project_name,
        count: 0
      };
    }
    assignmentStats.byProject[assignment.project_id].count++;

    // Group by position
    if (!assignmentStats.byPosition[assignment.position_name]) {
      assignmentStats.byPosition[assignment.position_name] = {
        position_code: assignment.position_code,
        position_color: assignment.position_color,
        count: 0
      };
    }
    assignmentStats.byPosition[assignment.position_name].count++;
  });

  res.json({
    message: 'Dashboard summary retrieved successfully',
    data: {
      dateRange: {
        startDate,
        endDate
      },
      assignments: assignmentStats,
      employees: employeeStats,
      projects: projectStats,
      conflicts: conflicts.length > 0 ? conflicts : null,
      generatedAt: new Date().toISOString()
    }
  });
}));

/**
 * @route   GET /api/dashboard/conflicts
 * @desc    Get assignment conflicts for date range
 * @access  Private
 */
router.get('/conflicts', [
  query('startDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Start date must be in YYYY-MM-DD format'),
  query('endDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('End date must be in YYYY-MM-DD format')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  // Default to current week if no dates provided
  const today = new Date();
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  if (!startDate || !endDate) {
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    startDate = monday.toISOString().split('T')[0];
    endDate = friday.toISOString().split('T')[0];
  }

  const conflicts = await Assignment.getConflicts(startDate, endDate);

  res.json({
    message: 'Assignment conflicts retrieved successfully',
    data: {
      conflicts,
      dateRange: {
        startDate,
        endDate
      },
      count: conflicts.length
    }
  });
}));

/**
 * @route   GET /api/dashboard/metrics
 * @desc    Get key performance metrics for dashboard
 * @access  Private
 */
router.get('/metrics', asyncHandler(async (req, res) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Calculate current week
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysToMonday);
  const weekStartDate = monday.toISOString().split('T')[0];

  // Get metrics data
  const [
    weekAssignments,
    todayUnassigned,
    employeeStats,
    projectStats
  ] = await Promise.all([
    Assignment.getWeekAssignments(weekStartDate),
    Employee.getUnassigned(todayStr),
    Employee.getStatistics(),
    Project.getStatistics()
  ]);

  // Calculate utilization rate
  const activeEmployees = employeeStats.overall.active_employees;
  const assignedToday = weekAssignments.summary.uniqueEmployees;
  const utilizationRate = activeEmployees > 0 ? (assignedToday / activeEmployees * 100).toFixed(1) : 0;

  const metrics = {
    totalEmployees: parseInt(employeeStats.overall.total_employees),
    activeEmployees: parseInt(employeeStats.overall.active_employees),
    assignedToday: assignedToday,
    unassignedToday: todayUnassigned.length,
    utilizationRate: parseFloat(utilizationRate),
    activeProjects: parseInt(projectStats.active_projects),
    totalProjects: parseInt(projectStats.total_projects),
    weeklyAssignments: weekAssignments.summary.totalAssignments,
    positionBreakdown: employeeStats.byPosition,
    currentWeek: weekStartDate,
    lastUpdated: new Date().toISOString()
  };

  res.json({
    message: 'Dashboard metrics retrieved successfully',
    data: metrics
  });
}));

/**
 * @route   GET /api/dashboard/recent-activity
 * @desc    Get recent assignment activity
 * @access  Private
 */
router.get('/recent-activity', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  // Get recent assignments (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startDate = sevenDaysAgo.toISOString().split('T')[0];
  const endDate = new Date().toISOString().split('T')[0];

  const recentAssignments = await Assignment.getByDateRange(startDate, endDate);

  // Sort by creation date and limit
  const recentActivity = recentAssignments
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit)
    .map(assignment => ({
      type: 'assignment',
      employee_name: assignment.employee_name,
      project_name: assignment.project_name,
      assignment_date: assignment.assignment_date,
      created_at: assignment.created_at,
      created_by: assignment.created_by_name
    }));

  res.json({
    message: 'Recent activity retrieved successfully',
    data: {
      activities: recentActivity,
      dateRange: {
        startDate,
        endDate
      },
      count: recentActivity.length
    }
  });
}));

module.exports = router;
