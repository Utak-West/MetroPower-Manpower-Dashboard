/**
 * User Routes
 *
 * Handles user management endpoints for the MetroPower Dashboard API
 *
 * Copyright 2025 The HigherSelf Network
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  res.status(501).json({
    error: 'Not implemented',
    message: 'User management not yet implemented'
  });
}));

module.exports = router;
