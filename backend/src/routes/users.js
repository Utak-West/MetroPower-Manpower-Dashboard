/**
 * User Routes
 * 
 * Handles user management functionality for the MetroPower Dashboard.
 * Includes user CRUD operations, profile management, and user administration.
 */

const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const User = require('../models/User');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { requireAdmin, requireManager } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin/Manager only)
 * @access  Private (Admin/Manager)
 */
router.get('/', requireManager, [
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
    .isIn(['first_name', 'last_name', 'email', 'role', 'created_at', 'last_login'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC'),
  query('role')
    .optional()
    .isIn(['Admin', 'Project Manager', 'Branch Manager', 'HR', 'View Only'])
    .withMessage('Invalid role'),
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),
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
    role: req.query.role,
    is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
    search: req.query.search
  };

  const pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 50,
    sortBy: req.query.sortBy || 'last_name',
    sortOrder: req.query.sortOrder || 'ASC'
  };

  const result = await User.getAll(filters, pagination);

  res.json({
    message: 'Users retrieved successfully',
    data: result.users,
    pagination: result.pagination,
    filters: filters
  });
}));

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', asyncHandler(async (req, res) => {
  const userId = req.user.user_id;
  const user = await User.getById(userId);

  if (!user) {
    throw new NotFoundError('User profile not found');
  }

  res.json({
    message: 'User profile retrieved successfully',
    data: user
  });
}));

/**
 * @route   GET /api/users/:userId
 * @desc    Get user by ID (Admin/Manager only)
 * @access  Private (Admin/Manager)
 */
router.get('/:userId', requireManager, [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const userId = parseInt(req.params.userId);
  const user = await User.getById(userId);

  if (!user) {
    throw new NotFoundError(`User with ID ${userId} not found`);
  }

  res.json({
    message: 'User retrieved successfully',
    data: user
  });
}));

/**
 * @route   POST /api/users
 * @desc    Create new user (Admin only)
 * @access  Private (Admin)
 */
router.post('/', requireAdmin, [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('first_name')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters')
    .trim(),
  body('last_name')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters')
    .trim(),
  body('role')
    .isIn(['Admin', 'Project Manager', 'Branch Manager', 'HR', 'View Only'])
    .withMessage('Invalid role specified')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const userData = req.body;
  const createdBy = req.user.user_id;

  const newUser = await User.create(userData, createdBy);

  res.status(201).json({
    message: 'User created successfully',
    data: newUser
  });
}));

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me', [
  body('first_name')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .trim(),
  body('last_name')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const userId = req.user.user_id;
  const updateData = req.body;

  // Users cannot change their own role
  delete updateData.role;
  delete updateData.is_active;

  const updatedUser = await User.update(userId, updateData, userId);

  res.json({
    message: 'Profile updated successfully',
    data: updatedUser
  });
}));

/**
 * @route   PUT /api/users/:userId
 * @desc    Update user (Admin only)
 * @access  Private (Admin)
 */
router.put('/:userId', requireAdmin, [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('first_name')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .trim(),
  body('last_name')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .trim(),
  body('role')
    .optional()
    .isIn(['Admin', 'Project Manager', 'Branch Manager', 'HR', 'View Only'])
    .withMessage('Invalid role specified'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const userId = parseInt(req.params.userId);
  const updateData = req.body;
  const updatedBy = req.user.user_id;

  const updatedUser = await User.update(userId, updateData, updatedBy);

  res.json({
    message: 'User updated successfully',
    data: updatedUser
  });
}));

/**
 * @route   PUT /api/users/:userId/deactivate
 * @desc    Deactivate user (Admin only)
 * @access  Private (Admin)
 */
router.put('/:userId/deactivate', requireAdmin, [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const userId = parseInt(req.params.userId);
  const updatedBy = req.user.user_id;

  // Prevent self-deactivation
  if (userId === updatedBy) {
    return res.status(400).json({
      error: 'Cannot deactivate yourself',
      message: 'You cannot deactivate your own account'
    });
  }

  const updatedUser = await User.update(userId, { is_active: false }, updatedBy);

  res.json({
    message: 'User deactivated successfully',
    data: updatedUser
  });
}));

/**
 * @route   PUT /api/users/:userId/activate
 * @desc    Activate user (Admin only)
 * @access  Private (Admin)
 */
router.put('/:userId/activate', requireAdmin, [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const userId = parseInt(req.params.userId);
  const updatedBy = req.user.user_id;

  const updatedUser = await User.update(userId, { is_active: true }, updatedBy);

  res.json({
    message: 'User activated successfully',
    data: updatedUser
  });
}));

module.exports = router;
