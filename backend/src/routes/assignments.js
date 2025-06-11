/**
 * Assignment Routes
 * 
 * Handles all assignment-related API endpoints for the MetroPower Dashboard.
 * Includes CRUD operations, bulk operations, and assignment management functionality.
 */

const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const Assignment = require('../models/Assignment');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/assignments
 * @desc    Get assignments for date range
 * @access  Private
 */
router.get('/', [
  query('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Start date must be in YYYY-MM-DD format'),
  query('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('End date must be in YYYY-MM-DD format'),
  query('project_id')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Project ID must be 20 characters or less'),
  query('employee_id')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Employee ID must be 10 characters or less'),
  query('position_id')
    .optional()
    .isInt()
    .withMessage('Position ID must be an integer')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { startDate, endDate } = req.query;
  const filters = {
    project_id: req.query.project_id,
    employee_id: req.query.employee_id,
    position_id: req.query.position_id ? parseInt(req.query.position_id) : undefined
  };

  const assignments = await Assignment.getByDateRange(startDate, endDate, filters);

  res.json({
    message: 'Assignments retrieved successfully',
    data: assignments,
    dateRange: { startDate, endDate },
    filters,
    count: assignments.length
  });
}));

/**
 * @route   GET /api/assignments/week/:date
 * @desc    Get week assignments organized by day and project
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

  res.json({
    message: 'Week assignments retrieved successfully',
    data: weekData
  });
}));

/**
 * @route   POST /api/assignments
 * @desc    Create new assignment
 * @access  Private (Manager+)
 */
router.post('/', [
  body('employee_id')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isLength({ max: 10 })
    .withMessage('Employee ID must be 10 characters or less')
    .trim(),
  body('project_id')
    .notEmpty()
    .withMessage('Project ID is required')
    .isLength({ max: 20 })
    .withMessage('Project ID must be 20 characters or less')
    .trim(),
  body('assignment_date')
    .notEmpty()
    .withMessage('Assignment date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Assignment date must be in YYYY-MM-DD format'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be 1000 characters or less')
    .trim()
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const assignmentData = req.body;
  const createdBy = req.user.user_id;

  const newAssignment = await Assignment.create(assignmentData, createdBy);

  // Emit real-time update via WebSocket
  const io = req.app.get('io');
  if (io) {
    io.emit('assignment-created', {
      assignment: newAssignment,
      employee_id: assignmentData.employee_id,
      project_id: assignmentData.project_id,
      assignment_date: assignmentData.assignment_date
    });
  }

  res.status(201).json({
    message: 'Assignment created successfully',
    data: newAssignment
  });
}));

/**
 * @route   POST /api/assignments/bulk
 * @desc    Create multiple assignments
 * @access  Private (Manager+)
 */
router.post('/bulk', [
  body('assignments')
    .isArray({ min: 1, max: 100 })
    .withMessage('Assignments must be an array with 1-100 items'),
  body('assignments.*.employee_id')
    .notEmpty()
    .withMessage('Employee ID is required for each assignment')
    .isLength({ max: 10 })
    .withMessage('Employee ID must be 10 characters or less'),
  body('assignments.*.project_id')
    .notEmpty()
    .withMessage('Project ID is required for each assignment')
    .isLength({ max: 20 })
    .withMessage('Project ID must be 20 characters or less'),
  body('assignments.*.assignment_date')
    .notEmpty()
    .withMessage('Assignment date is required for each assignment')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Assignment date must be in YYYY-MM-DD format'),
  body('assignments.*.notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be 1000 characters or less')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { assignments } = req.body;
  const createdBy = req.user.user_id;

  const createdAssignments = await Assignment.bulkCreate(assignments, createdBy);

  // Emit real-time update via WebSocket
  const io = req.app.get('io');
  if (io) {
    io.emit('assignments-bulk-created', {
      assignments: createdAssignments,
      count: createdAssignments.length
    });
  }

  res.status(201).json({
    message: 'Bulk assignments created successfully',
    data: createdAssignments,
    count: createdAssignments.length
  });
}));

/**
 * @route   PUT /api/assignments/:assignmentId
 * @desc    Update assignment
 * @access  Private (Manager+)
 */
router.put('/:assignmentId', [
  param('assignmentId')
    .isInt({ min: 1 })
    .withMessage('Assignment ID must be a positive integer'),
  body('employee_id')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Employee ID must be 10 characters or less')
    .trim(),
  body('project_id')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Project ID must be 20 characters or less')
    .trim(),
  body('assignment_date')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Assignment date must be in YYYY-MM-DD format'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be 1000 characters or less')
    .trim()
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const assignmentId = parseInt(req.params.assignmentId);
  const updateData = req.body;
  const updatedBy = req.user.user_id;

  const updatedAssignment = await Assignment.update(assignmentId, updateData, updatedBy);

  // Emit real-time update via WebSocket
  const io = req.app.get('io');
  if (io) {
    io.emit('assignment-updated', {
      assignment: updatedAssignment,
      assignmentId,
      changes: updateData
    });
  }

  res.json({
    message: 'Assignment updated successfully',
    data: updatedAssignment
  });
}));

/**
 * @route   DELETE /api/assignments/:assignmentId
 * @desc    Delete assignment
 * @access  Private (Manager+)
 */
router.delete('/:assignmentId', [
  param('assignmentId')
    .isInt({ min: 1 })
    .withMessage('Assignment ID must be a positive integer')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const assignmentId = parseInt(req.params.assignmentId);
  const deletedBy = req.user.user_id;

  await Assignment.delete(assignmentId, deletedBy);

  // Emit real-time update via WebSocket
  const io = req.app.get('io');
  if (io) {
    io.emit('assignment-deleted', {
      assignmentId,
      deletedBy
    });
  }

  res.json({
    message: 'Assignment deleted successfully',
    assignmentId
  });
}));

/**
 * @route   POST /api/assignments/move
 * @desc    Move employee assignment (drag and drop functionality)
 * @access  Private (Manager+)
 */
router.post('/move', [
  body('employee_id')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isLength({ max: 10 })
    .withMessage('Employee ID must be 10 characters or less'),
  body('from_project_id')
    .optional()
    .isLength({ max: 20 })
    .withMessage('From Project ID must be 20 characters or less'),
  body('to_project_id')
    .notEmpty()
    .withMessage('To Project ID is required')
    .isLength({ max: 20 })
    .withMessage('To Project ID must be 20 characters or less'),
  body('assignment_date')
    .notEmpty()
    .withMessage('Assignment date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Assignment date must be in YYYY-MM-DD format'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be 1000 characters or less')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { employee_id, from_project_id, to_project_id, assignment_date, notes } = req.body;
  const updatedBy = req.user.user_id;

  let result;

  if (from_project_id) {
    // Update existing assignment
    // First, find the existing assignment
    const existingAssignments = await Assignment.getByDateRange(assignment_date, assignment_date, {
      employee_id,
      project_id: from_project_id
    });

    if (existingAssignments.length === 0) {
      throw new NotFoundError('Existing assignment not found');
    }

    const assignmentId = existingAssignments[0].assignment_id;
    result = await Assignment.update(assignmentId, {
      project_id: to_project_id,
      notes
    }, updatedBy);

    result.action = 'moved';
  } else {
    // Create new assignment (from unassigned)
    result = await Assignment.create({
      employee_id,
      project_id: to_project_id,
      assignment_date,
      notes
    }, updatedBy);

    result.action = 'assigned';
  }

  // Emit real-time update via WebSocket
  const io = req.app.get('io');
  if (io) {
    io.emit('assignment-moved', {
      employee_id,
      from_project_id,
      to_project_id,
      assignment_date,
      action: result.action,
      assignment: result
    });
  }

  res.json({
    message: `Employee ${result.action} successfully`,
    data: result,
    action: result.action
  });
}));

/**
 * @route   GET /api/assignments/conflicts
 * @desc    Get assignment conflicts for date range
 * @access  Private
 */
router.get('/conflicts', [
  query('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Start date must be in YYYY-MM-DD format'),
  query('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('End date must be in YYYY-MM-DD format')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { startDate, endDate } = req.query;
  const conflicts = await Assignment.getConflicts(startDate, endDate);

  res.json({
    message: 'Assignment conflicts retrieved successfully',
    data: conflicts,
    dateRange: { startDate, endDate },
    count: conflicts.length
  });
}));

module.exports = router;
