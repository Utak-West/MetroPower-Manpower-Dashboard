/**
 * Project Routes
 *
 * Handles project management endpoints for the MetroPower Dashboard API
 * with comprehensive error handling and demo mode support.
 *
 * Copyright 2025 The HigherSelf Network
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireManager } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/projects
 * @desc    Get all projects
 * @access  Private
 */
router.get('/', asyncHandler(async (req, res) => {
  try {
    if (global.isDemoMode) {
      const demoService = require('../services/demoService');
      const projects = await demoService.getProjects();

      return res.json({
        success: true,
        data: projects,
        isDemoMode: true
      });
    }

    // Database mode implementation would go here
    // For now, fallback to demo service
    const demoService = require('../services/demoService');
    const projects = await demoService.getProjects();

    res.json({
      success: true,
      data: projects
    });

  } catch (error) {
    logger.error('Error fetching projects:', error);
    res.status(500).json({
      error: 'Project fetch error',
      message: 'Failed to fetch projects'
    });
  }
}));

/**
 * @route   GET /api/projects/active
 * @desc    Get active projects
 * @access  Private
 */
router.get('/active', asyncHandler(async (req, res) => {
  try {
    if (global.isDemoMode) {
      const demoService = require('../services/demoService');
      const activeProjects = await demoService.getActiveProjects();

      return res.json({
        success: true,
        data: activeProjects,
        isDemoMode: true
      });
    }

    // Database mode implementation would go here
    // For now, fallback to demo service
    const demoService = require('../services/demoService');
    const activeProjects = await demoService.getActiveProjects();

    res.json({
      success: true,
      data: activeProjects
    });

  } catch (error) {
    logger.error('Error fetching active projects:', error);
    res.status(500).json({
      error: 'Active projects error',
      message: 'Failed to fetch active projects'
    });
  }
}));

module.exports = router;
