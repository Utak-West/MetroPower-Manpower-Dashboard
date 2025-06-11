/**
 * Project Routes
 * 
 * Handles all project-related API endpoints for the MetroPower Dashboard.
 * Includes CRUD operations, search, and project management functionality.
 */

const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const Project = require('../models/Project');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { canAccessProject } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/projects
 * @desc    Get all projects with filtering and pagination
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
    .isIn(['name', 'number', 'status', 'start_date', 'end_date', 'created_at'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC'),
  query('status')
    .optional()
    .isIn(['Active', 'Completed', 'On Hold', 'Planned'])
    .withMessage('Invalid status'),
  query('manager_id')
    .optional()
    .isInt()
    .withMessage('Manager ID must be an integer'),
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
    manager_id: req.query.manager_id ? parseInt(req.query.manager_id) : undefined,
    search: req.query.search
  };

  const pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 50,
    sortBy: req.query.sortBy || 'name',
    sortOrder: req.query.sortOrder || 'ASC'
  };

  const result = await Project.getAll(filters, pagination);

  res.json({
    message: 'Projects retrieved successfully',
    data: result.projects,
    pagination: result.pagination,
    filters: filters
  });
}));

/**
 * @route   GET /api/projects/active
 * @desc    Get all active projects
 * @access  Private
 */
router.get('/active', asyncHandler(async (req, res) => {
  const activeProjects = await Project.getActive();

  res.json({
    message: 'Active projects retrieved successfully',
    data: activeProjects,
    count: activeProjects.length
  });
}));

/**
 * @route   GET /api/projects/search
 * @desc    Search projects by name or number
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

  const projects = await Project.search(searchTerm, limit);

  res.json({
    message: 'Project search completed',
    data: projects,
    searchTerm,
    count: projects.length
  });
}));

/**
 * @route   GET /api/projects/statistics
 * @desc    Get project statistics
 * @access  Private
 */
router.get('/statistics', asyncHandler(async (req, res) => {
  const statistics = await Project.getStatistics();

  res.json({
    message: 'Project statistics retrieved successfully',
    data: statistics
  });
}));

/**
 * @route   GET /api/projects/:projectId
 * @desc    Get project by ID
 * @access  Private
 */
router.get('/:projectId', [
  param('projectId')
    .notEmpty()
    .withMessage('Project ID is required')
    .isLength({ max: 20 })
    .withMessage('Project ID must be 20 characters or less')
], canAccessProject('projectId'), asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const projectId = req.params.projectId;
  const project = await Project.getById(projectId);

  if (!project) {
    throw new NotFoundError(`Project with ID ${projectId} not found`);
  }

  res.json({
    message: 'Project retrieved successfully',
    data: project
  });
}));

/**
 * @route   GET /api/projects/:projectId/assignments
 * @desc    Get project assignments for date range
 * @access  Private
 */
router.get('/:projectId/assignments', [
  param('projectId')
    .notEmpty()
    .withMessage('Project ID is required'),
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
], canAccessProject('projectId'), asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const projectId = req.params.projectId;
  const { startDate, endDate } = req.query;

  const assignments = await Project.getAssignments(projectId, startDate, endDate);

  res.json({
    message: 'Project assignments retrieved successfully',
    data: assignments,
    projectId,
    dateRange: { startDate, endDate },
    count: assignments.length
  });
}));

/**
 * @route   GET /api/projects/:projectId/statistics
 * @desc    Get statistics for specific project
 * @access  Private
 */
router.get('/:projectId/statistics', [
  param('projectId')
    .notEmpty()
    .withMessage('Project ID is required')
], canAccessProject('projectId'), asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const projectId = req.params.projectId;
  const statistics = await Project.getStatistics(projectId);

  if (!statistics) {
    throw new NotFoundError(`Project with ID ${projectId} not found`);
  }

  res.json({
    message: 'Project statistics retrieved successfully',
    data: statistics
  });
}));

/**
 * @route   POST /api/projects
 * @desc    Create new project
 * @access  Private (Manager+)
 */
router.post('/', [
  body('project_id')
    .notEmpty()
    .withMessage('Project ID is required')
    .isLength({ max: 20 })
    .withMessage('Project ID must be 20 characters or less')
    .trim(),
  body('name')
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .trim(),
  body('number')
    .notEmpty()
    .withMessage('Project number is required')
    .isLength({ max: 20 })
    .withMessage('Project number must be 20 characters or less')
    .trim(),
  body('status')
    .optional()
    .isIn(['Active', 'Completed', 'On Hold', 'Planned'])
    .withMessage('Invalid status'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must be 100 characters or less')
    .trim(),
  body('manager_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Manager ID must be a positive integer'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be 1000 characters or less')
    .trim(),
  body('budget')
    .optional()
    .isDecimal()
    .withMessage('Budget must be a valid decimal number')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const projectData = req.body;
  const createdBy = req.user.user_id;

  const newProject = await Project.create(projectData, createdBy);

  res.status(201).json({
    message: 'Project created successfully',
    data: newProject
  });
}));

/**
 * @route   PUT /api/projects/:projectId
 * @desc    Update project
 * @access  Private (Manager+)
 */
router.put('/:projectId', [
  param('projectId')
    .notEmpty()
    .withMessage('Project ID is required'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .trim(),
  body('number')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Project number must be 20 characters or less')
    .trim(),
  body('status')
    .optional()
    .isIn(['Active', 'Completed', 'On Hold', 'Planned'])
    .withMessage('Invalid status'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must be 100 characters or less')
    .trim(),
  body('manager_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Manager ID must be a positive integer'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be 1000 characters or less')
    .trim(),
  body('budget')
    .optional()
    .isDecimal()
    .withMessage('Budget must be a valid decimal number')
], canAccessProject('projectId'), asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const projectId = req.params.projectId;
  const updateData = req.body;
  const updatedBy = req.user.user_id;

  const updatedProject = await Project.update(projectId, updateData, updatedBy);

  res.json({
    message: 'Project updated successfully',
    data: updatedProject
  });
}));

/**
 * @route   DELETE /api/projects/:projectId
 * @desc    Delete project (only if no assignments exist)
 * @access  Private (Admin only)
 */
router.delete('/:projectId', [
  param('projectId')
    .notEmpty()
    .withMessage('Project ID is required')
], canAccessProject('projectId'), asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const projectId = req.params.projectId;
  const deletedBy = req.user.user_id;

  // Only allow admins to delete projects
  if (req.user.role !== 'Admin') {
    return res.status(403).json({
      error: 'Insufficient permissions',
      message: 'Only administrators can delete projects'
    });
  }

  await Project.delete(projectId, deletedBy);

  res.json({
    message: 'Project deleted successfully',
    projectId
  });
}));

module.exports = router;
