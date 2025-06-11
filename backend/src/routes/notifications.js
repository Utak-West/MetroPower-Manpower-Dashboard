/**
 * Notification Routes
 * 
 * Handles notification functionality for the MetroPower Dashboard.
 * Manages user notifications, email alerts, and notification preferences.
 */

const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { query as dbQuery } = require('../config/database');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
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
  query('read_status')
    .optional()
    .isBoolean()
    .withMessage('Read status must be a boolean'),
  query('type')
    .optional()
    .isIn(['Assignment Change', 'Daily Summary', 'Exception Alert'])
    .withMessage('Invalid notification type')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const userId = req.user.user_id;

  // Build WHERE clause
  const conditions = ['recipient_id = $1'];
  const params = [userId];
  let paramIndex = 2;

  if (req.query.read_status !== undefined) {
    conditions.push(`read_status = $${paramIndex++}`);
    params.push(req.query.read_status === 'true');
  }

  if (req.query.type) {
    conditions.push(`type = $${paramIndex++}`);
    params.push(req.query.type);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const notificationsQuery = `
    SELECT 
      notification_id,
      type,
      subject,
      content,
      related_assignment_id,
      read_status,
      sent_at,
      created_at
    FROM notifications
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(limit, offset);

  const countQuery = `
    SELECT COUNT(*) as total
    FROM notifications
    ${whereClause}
  `;

  const countParams = params.slice(0, -2); // Remove limit and offset

  const [notificationsResult, countResult] = await Promise.all([
    dbQuery(notificationsQuery, params),
    dbQuery(countQuery, countParams)
  ]);

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  res.json({
    message: 'Notifications retrieved successfully',
    data: notificationsResult.rows,
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
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Private
 */
router.get('/unread-count', asyncHandler(async (req, res) => {
  const userId = req.user.user_id;

  const countQuery = `
    SELECT COUNT(*) as unread_count
    FROM notifications
    WHERE recipient_id = $1 AND read_status = false
  `;

  const result = await dbQuery(countQuery, [userId]);
  const unreadCount = parseInt(result.rows[0].unread_count);

  res.json({
    message: 'Unread count retrieved successfully',
    data: {
      unread_count: unreadCount
    }
  });
}));

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:notificationId/read', [
  param('notificationId')
    .isInt({ min: 1 })
    .withMessage('Notification ID must be a positive integer')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const notificationId = parseInt(req.params.notificationId);
  const userId = req.user.user_id;

  const updateQuery = `
    UPDATE notifications 
    SET read_status = true
    WHERE notification_id = $1 AND recipient_id = $2
    RETURNING notification_id, read_status
  `;

  const result = await dbQuery(updateQuery, [notificationId, userId]);

  if (result.rows.length === 0) {
    throw new NotFoundError('Notification not found or access denied');
  }

  res.json({
    message: 'Notification marked as read',
    data: result.rows[0]
  });
}));

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all notifications as read for user
 * @access  Private
 */
router.put('/mark-all-read', asyncHandler(async (req, res) => {
  const userId = req.user.user_id;

  const updateQuery = `
    UPDATE notifications 
    SET read_status = true
    WHERE recipient_id = $1 AND read_status = false
    RETURNING COUNT(*) as updated_count
  `;

  const result = await dbQuery(updateQuery, [userId]);

  res.json({
    message: 'All notifications marked as read',
    data: {
      updated_count: result.rowCount
    }
  });
}));

/**
 * @route   POST /api/notifications
 * @desc    Create notification (System/Admin use)
 * @access  Private (Admin)
 */
router.post('/', [
  body('recipient_id')
    .isInt({ min: 1 })
    .withMessage('Recipient ID must be a positive integer'),
  body('type')
    .isIn(['Assignment Change', 'Daily Summary', 'Exception Alert'])
    .withMessage('Invalid notification type'),
  body('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Subject must be between 1 and 255 characters')
    .trim(),
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Content must be between 1 and 2000 characters')
    .trim(),
  body('related_assignment_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Related assignment ID must be a positive integer')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  // Only allow admins to create notifications manually
  if (req.user.role !== 'Admin') {
    return res.status(403).json({
      error: 'Insufficient permissions',
      message: 'Only administrators can create notifications manually'
    });
  }

  const {
    recipient_id,
    type,
    subject,
    content,
    related_assignment_id
  } = req.body;

  const insertQuery = `
    INSERT INTO notifications (
      type, recipient_id, subject, content, related_assignment_id
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING notification_id, sent_at, created_at
  `;

  const result = await dbQuery(insertQuery, [
    type,
    recipient_id,
    subject,
    content,
    related_assignment_id || null
  ]);

  const newNotification = result.rows[0];

  logger.logBusiness('notification_created', {
    notificationId: newNotification.notification_id,
    type,
    recipientId: recipient_id,
    createdBy: req.user.user_id
  });

  res.status(201).json({
    message: 'Notification created successfully',
    data: {
      notification_id: newNotification.notification_id,
      type,
      subject,
      content,
      recipient_id,
      related_assignment_id,
      sent_at: newNotification.sent_at,
      created_at: newNotification.created_at
    }
  });
}));

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:notificationId', [
  param('notificationId')
    .isInt({ min: 1 })
    .withMessage('Notification ID must be a positive integer')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const notificationId = parseInt(req.params.notificationId);
  const userId = req.user.user_id;

  // Users can only delete their own notifications, admins can delete any
  let deleteQuery;
  let params;

  if (req.user.role === 'Admin') {
    deleteQuery = `
      DELETE FROM notifications 
      WHERE notification_id = $1
      RETURNING notification_id
    `;
    params = [notificationId];
  } else {
    deleteQuery = `
      DELETE FROM notifications 
      WHERE notification_id = $1 AND recipient_id = $2
      RETURNING notification_id
    `;
    params = [notificationId, userId];
  }

  const result = await dbQuery(deleteQuery, params);

  if (result.rows.length === 0) {
    throw new NotFoundError('Notification not found or access denied');
  }

  res.json({
    message: 'Notification deleted successfully',
    notificationId
  });
}));

/**
 * @route   GET /api/notifications/recent
 * @desc    Get recent notifications (last 24 hours)
 * @access  Private
 */
router.get('/recent', asyncHandler(async (req, res) => {
  const userId = req.user.user_id;

  const recentQuery = `
    SELECT 
      notification_id,
      type,
      subject,
      content,
      related_assignment_id,
      read_status,
      sent_at,
      created_at
    FROM notifications
    WHERE recipient_id = $1 
      AND created_at >= NOW() - INTERVAL '24 hours'
    ORDER BY created_at DESC
    LIMIT 10
  `;

  const result = await dbQuery(recentQuery, [userId]);

  res.json({
    message: 'Recent notifications retrieved successfully',
    data: result.rows,
    count: result.rows.length
  });
}));

module.exports = router;
