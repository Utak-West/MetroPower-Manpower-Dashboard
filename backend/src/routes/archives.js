/**
 * Archive Routes
 * 
 * Handles weekly archive functionality for the MetroPower Dashboard.
 * Allows archiving completed weeks and retrieving historical data.
 */

const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { query: dbQuery } = require('../config/database');
const Assignment = require('../models/Assignment');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/archives
 * @desc    Get list of archived weeks
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
    .withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const archivesQuery = `
    SELECT 
      archive_id,
      week_start_date,
      week_end_date,
      created_by,
      u.first_name || ' ' || u.last_name as created_by_name,
      created_at
    FROM weekly_archives wa
    LEFT JOIN users u ON wa.created_by = u.user_id
    ORDER BY week_start_date DESC
    LIMIT $1 OFFSET $2
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM weekly_archives
  `;

  const [archivesResult, countResult] = await Promise.all([
    dbQuery(archivesQuery, [limit, offset]),
    dbQuery(countQuery)
  ]);

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  res.json({
    message: 'Archives retrieved successfully',
    data: archivesResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
}));

/**
 * @route   GET /api/archives/:archiveId
 * @desc    Get specific archived week data
 * @access  Private
 */
router.get('/:archiveId', [
  param('archiveId')
    .isInt({ min: 1 })
    .withMessage('Archive ID must be a positive integer')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const archiveId = parseInt(req.params.archiveId);

  const archiveQuery = `
    SELECT 
      archive_id,
      week_start_date,
      week_end_date,
      archive_data,
      created_by,
      u.first_name || ' ' || u.last_name as created_by_name,
      created_at
    FROM weekly_archives wa
    LEFT JOIN users u ON wa.created_by = u.user_id
    WHERE wa.archive_id = $1
  `;

  const result = await dbQuery(archiveQuery, [archiveId]);

  if (result.rows.length === 0) {
    throw new NotFoundError(`Archive with ID ${archiveId} not found`);
  }

  const archive = result.rows[0];

  res.json({
    message: 'Archive retrieved successfully',
    data: {
      archive_id: archive.archive_id,
      week_start_date: archive.week_start_date,
      week_end_date: archive.week_end_date,
      archive_data: archive.archive_data,
      created_by: archive.created_by,
      created_by_name: archive.created_by_name,
      created_at: archive.created_at
    }
  });
}));

/**
 * @route   POST /api/archives
 * @desc    Create archive for a specific week
 * @access  Private (Manager+)
 */
router.post('/', [
  body('week_start_date')
    .notEmpty()
    .withMessage('Week start date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Week start date must be in YYYY-MM-DD format')
    .custom((value) => {
      const date = new Date(value);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 1) { // Monday = 1
        throw new Error('Week start date must be a Monday');
      }
      return true;
    })
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { week_start_date } = req.body;
  const createdBy = req.user.user_id;

  // Calculate week end date (Friday)
  const startDate = new Date(week_start_date);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 4);
  const week_end_date = endDate.toISOString().split('T')[0];

  // Check if archive already exists for this week
  const existingArchiveQuery = `
    SELECT archive_id FROM weekly_archives 
    WHERE week_start_date = $1 AND week_end_date = $2
  `;
  
  const existingResult = await dbQuery(existingArchiveQuery, [week_start_date, week_end_date]);
  
  if (existingResult.rows.length > 0) {
    return res.status(409).json({
      error: 'Archive already exists',
      message: `Archive for week ${week_start_date} to ${week_end_date} already exists`,
      existingArchiveId: existingResult.rows[0].archive_id
    });
  }

  // Get week assignments data
  const weekData = await Assignment.getWeekAssignments(week_start_date);

  // Create archive
  const insertArchiveQuery = `
    INSERT INTO weekly_archives (week_start_date, week_end_date, archive_data, created_by)
    VALUES ($1, $2, $3, $4)
    RETURNING archive_id, created_at
  `;

  const archiveResult = await dbQuery(insertArchiveQuery, [
    week_start_date,
    week_end_date,
    JSON.stringify(weekData),
    createdBy
  ]);

  const newArchive = archiveResult.rows[0];

  logger.logBusiness('week_archived', {
    archiveId: newArchive.archive_id,
    weekStart: week_start_date,
    weekEnd: week_end_date,
    createdBy,
    assignmentCount: weekData.summary.totalAssignments
  });

  res.status(201).json({
    message: 'Week archived successfully',
    data: {
      archive_id: newArchive.archive_id,
      week_start_date,
      week_end_date,
      created_at: newArchive.created_at,
      summary: weekData.summary
    }
  });
}));

/**
 * @route   DELETE /api/archives/:archiveId
 * @desc    Delete archive (Admin only)
 * @access  Private (Admin)
 */
router.delete('/:archiveId', [
  param('archiveId')
    .isInt({ min: 1 })
    .withMessage('Archive ID must be a positive integer')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  // Only allow admins to delete archives
  if (req.user.role !== 'Admin') {
    return res.status(403).json({
      error: 'Insufficient permissions',
      message: 'Only administrators can delete archives'
    });
  }

  const archiveId = parseInt(req.params.archiveId);

  // Get archive info before deletion
  const archiveInfoQuery = `
    SELECT week_start_date, week_end_date 
    FROM weekly_archives 
    WHERE archive_id = $1
  `;
  
  const archiveInfo = await dbQuery(archiveInfoQuery, [archiveId]);
  
  if (archiveInfo.rows.length === 0) {
    throw new NotFoundError(`Archive with ID ${archiveId} not found`);
  }

  // Delete the archive
  const deleteQuery = `
    DELETE FROM weekly_archives 
    WHERE archive_id = $1
    RETURNING archive_id
  `;

  const deleteResult = await dbQuery(deleteQuery, [archiveId]);

  if (deleteResult.rows.length === 0) {
    throw new NotFoundError(`Archive with ID ${archiveId} not found`);
  }

  logger.logBusiness('archive_deleted', {
    archiveId,
    weekStart: archiveInfo.rows[0].week_start_date,
    weekEnd: archiveInfo.rows[0].week_end_date,
    deletedBy: req.user.user_id
  });

  res.json({
    message: 'Archive deleted successfully',
    archiveId
  });
}));

/**
 * @route   GET /api/archives/week/:date
 * @desc    Get archive for specific week by date
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

  // Calculate week end (Friday)
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const weekEndDate = friday.toISOString().split('T')[0];

  const archiveQuery = `
    SELECT 
      archive_id,
      week_start_date,
      week_end_date,
      archive_data,
      created_by,
      u.first_name || ' ' || u.last_name as created_by_name,
      created_at
    FROM weekly_archives wa
    LEFT JOIN users u ON wa.created_by = u.user_id
    WHERE wa.week_start_date = $1 AND wa.week_end_date = $2
  `;

  const result = await dbQuery(archiveQuery, [weekStartDate, weekEndDate]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: 'Archive not found',
      message: `No archive found for week ${weekStartDate} to ${weekEndDate}`,
      weekStart: weekStartDate,
      weekEnd: weekEndDate
    });
  }

  const archive = result.rows[0];

  res.json({
    message: 'Archive retrieved successfully',
    data: {
      archive_id: archive.archive_id,
      week_start_date: archive.week_start_date,
      week_end_date: archive.week_end_date,
      archive_data: archive.archive_data,
      created_by: archive.created_by,
      created_by_name: archive.created_by_name,
      created_at: archive.created_at
    }
  });
}));

module.exports = router;
