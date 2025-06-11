/**
 * Employee Routes
 * 
 * Handles all employee-related API endpoints for the MetroPower Dashboard.
 * Includes CRUD operations, search, and employee management functionality.
 */

const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const Employee = require('../models/Employee');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { canAccessEmployee } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/employees
 * @desc    Get all employees with filtering and pagination
 * @access  Private
 */
router.get('/', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['name', 'employee_id', 'position_id', 'status', 'hire_date', 'created_at'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC'),
  query('status')
    .optional()
    .isIn(['Active', 'PTO', 'Leave', 'Military', 'Terminated'])
    .withMessage('Invalid status'),
  query('position_id')
    .optional()
    .isInt()
    .withMessage('Position ID must be an integer'),
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
    .trim()
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const filters = {
    status: req.query.status,
    position_id: req.query.position_id ? parseInt(req.query.position_id) : undefined,
    search: req.query.search
  };

  const pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 50,
    sortBy: req.query.sortBy || 'name',
    sortOrder: req.query.sortOrder || 'ASC'
  };

  const result = await Employee.getAll(filters, pagination);

  res.json({
    message: 'Employees retrieved successfully',
    data: result.employees,
    pagination: result.pagination,
    filters: filters
  });
}));

/**
 * @route   GET /api/employees/search
 * @desc    Search employees by name or ID
 * @access  Private
 */
router.get('/search', [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .trim(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const searchTerm = req.query.q;
  const limit = parseInt(req.query.limit) || 20;

  const employees = await Employee.search(searchTerm, limit);

  res.json({
    message: 'Employee search completed',
    data: employees,
    searchTerm,
    count: employees.length
  });
}));

/**
 * @route   GET /api/employees/unassigned/:date
 * @desc    Get unassigned employees for a specific date
 * @access  Private
 */
router.get('/unassigned/:date', [
  param('date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const date = req.params.date;
  const employees = await Employee.getUnassigned(date);

  res.json({
    message: 'Unassigned employees retrieved successfully',
    data: employees,
    date,
    count: employees.length
  });
}));

/**
 * @route   GET /api/employees/statistics
 * @desc    Get employee statistics
 * @access  Private
 */
router.get('/statistics', asyncHandler(async (req, res) => {
  const statistics = await Employee.getStatistics();

  res.json({
    message: 'Employee statistics retrieved successfully',
    data: statistics
  });
}));

/**
 * @route   GET /api/employees/:employeeId
 * @desc    Get employee by ID
 * @access  Private
 */
router.get('/:employeeId', [
  param('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isLength({ max: 10 })
    .withMessage('Employee ID must be 10 characters or less')
], canAccessEmployee('employeeId'), asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const employeeId = req.params.employeeId;
  const employee = await Employee.getById(employeeId);

  if (!employee) {
    throw new NotFoundError(`Employee with ID ${employeeId} not found`);
  }

  res.json({
    message: 'Employee retrieved successfully',
    data: employee
  });
}));

/**
 * @route   POST /api/employees
 * @desc    Create new employee
 * @access  Private (Manager+)
 */
router.post('/', [
  body('employee_id')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isLength({ max: 10 })
    .withMessage('Employee ID must be 10 characters or less')
    .trim(),
  body('name')
    .notEmpty()
    .withMessage('Employee name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .trim(),
  body('position_id')
    .isInt({ min: 1 })
    .withMessage('Position ID must be a positive integer'),
  body('status')
    .optional()
    .isIn(['Active', 'PTO', 'Leave', 'Military', 'Terminated'])
    .withMessage('Invalid status'),
  body('employee_number')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Employee number must be 20 characters or less')
    .trim(),
  body('hire_date')
    .optional()
    .isISO8601()
    .withMessage('Hire date must be a valid date'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
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

  const employeeData = req.body;
  const createdBy = req.user.user_id;

  const newEmployee = await Employee.create(employeeData, createdBy);

  res.status(201).json({
    message: 'Employee created successfully',
    data: newEmployee
  });
}));

/**
 * @route   PUT /api/employees/:employeeId
 * @desc    Update employee
 * @access  Private (Manager+)
 */
router.put('/:employeeId', [
  param('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .trim(),
  body('position_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Position ID must be a positive integer'),
  body('status')
    .optional()
    .isIn(['Active', 'PTO', 'Leave', 'Military', 'Terminated'])
    .withMessage('Invalid status'),
  body('employee_number')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Employee number must be 20 characters or less')
    .trim(),
  body('hire_date')
    .optional()
    .isISO8601()
    .withMessage('Hire date must be a valid date'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be 1000 characters or less')
    .trim()
], canAccessEmployee('employeeId'), asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const employeeId = req.params.employeeId;
  const updateData = req.body;
  const updatedBy = req.user.user_id;

  const updatedEmployee = await Employee.update(employeeId, updateData, updatedBy);

  res.json({
    message: 'Employee updated successfully',
    data: updatedEmployee
  });
}));

/**
 * @route   DELETE /api/employees/:employeeId
 * @desc    Soft delete employee (set status to Terminated)
 * @access  Private (Manager+)
 */
router.delete('/:employeeId', [
  param('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
], canAccessEmployee('employeeId'), asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const employeeId = req.params.employeeId;
  const deletedBy = req.user.user_id;

  await Employee.delete(employeeId, deletedBy);

  res.json({
    message: 'Employee deleted successfully',
    employeeId
  });
}));

module.exports = router;
