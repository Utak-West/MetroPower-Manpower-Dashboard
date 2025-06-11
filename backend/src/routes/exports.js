/**
 * Export Routes
 * 
 * Handles data export functionality for the MetroPower Dashboard.
 * Supports Excel, CSV, PDF, and Markdown export formats.
 */

const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs').promises;
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const Assignment = require('../models/Assignment');
const Employee = require('../models/Employee');
const Project = require('../models/Project');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   POST /api/exports/excel
 * @desc    Generate Excel export
 * @access  Private
 */
router.post('/excel', [
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Start date must be in YYYY-MM-DD format'),
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('End date must be in YYYY-MM-DD format'),
  body('includeEmployees')
    .optional()
    .isBoolean()
    .withMessage('Include employees must be a boolean'),
  body('includeProjects')
    .optional()
    .isBoolean()
    .withMessage('Include projects must be a boolean'),
  body('includeAssignments')
    .optional()
    .isBoolean()
    .withMessage('Include assignments must be a boolean')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const {
    startDate,
    endDate,
    includeEmployees = true,
    includeProjects = true,
    includeAssignments = true
  } = req.body;

  try {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();

    // Set workbook properties
    workbook.creator = 'MetroPower Dashboard';
    workbook.lastModifiedBy = req.user.username;
    workbook.created = new Date();
    workbook.modified = new Date();

    // Get data
    const [assignments, employees, projects] = await Promise.all([
      includeAssignments ? Assignment.getByDateRange(startDate, endDate) : [],
      includeEmployees ? Employee.getAll() : { employees: [] },
      includeProjects ? Project.getAll() : { projects: [] }
    ]);

    // Create assignments worksheet
    if (includeAssignments && assignments.length > 0) {
      const assignmentSheet = workbook.addWorksheet('Assignments');
      
      // Add headers
      assignmentSheet.columns = [
        { header: 'Assignment Date', key: 'assignment_date', width: 15 },
        { header: 'Employee ID', key: 'employee_id', width: 12 },
        { header: 'Employee Name', key: 'employee_name', width: 25 },
        { header: 'Position', key: 'position_name', width: 20 },
        { header: 'Project ID', key: 'project_id', width: 15 },
        { header: 'Project Name', key: 'project_name', width: 30 },
        { header: 'Project Number', key: 'project_number', width: 15 },
        { header: 'Notes', key: 'notes', width: 40 }
      ];

      // Style headers
      assignmentSheet.getRow(1).font = { bold: true };
      assignmentSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE52822' }
      };

      // Add data
      assignments.forEach(assignment => {
        assignmentSheet.addRow({
          assignment_date: assignment.assignment_date,
          employee_id: assignment.employee_id,
          employee_name: assignment.employee_name,
          position_name: assignment.position_name,
          project_id: assignment.project_id,
          project_name: assignment.project_name,
          project_number: assignment.project_number,
          notes: assignment.notes || ''
        });
      });
    }

    // Create employees worksheet
    if (includeEmployees && employees.employees && employees.employees.length > 0) {
      const employeeSheet = workbook.addWorksheet('Employees');
      
      employeeSheet.columns = [
        { header: 'Employee ID', key: 'employee_id', width: 12 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Position', key: 'position_name', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Employee Number', key: 'employee_number', width: 15 },
        { header: 'Hire Date', key: 'hire_date', width: 12 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Email', key: 'email', width: 25 }
      ];

      employeeSheet.getRow(1).font = { bold: true };
      employeeSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B5998' }
      };

      employees.employees.forEach(employee => {
        employeeSheet.addRow({
          employee_id: employee.employee_id,
          name: employee.name,
          position_name: employee.position_name,
          status: employee.status,
          employee_number: employee.employee_number || '',
          hire_date: employee.hire_date || '',
          phone: employee.phone || '',
          email: employee.email || ''
        });
      });
    }

    // Create projects worksheet
    if (includeProjects && projects.projects && projects.projects.length > 0) {
      const projectSheet = workbook.addWorksheet('Projects');
      
      projectSheet.columns = [
        { header: 'Project ID', key: 'project_id', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Number', key: 'number', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Location', key: 'location', width: 25 },
        { header: 'Manager', key: 'manager_name', width: 25 },
        { header: 'Start Date', key: 'start_date', width: 12 },
        { header: 'End Date', key: 'end_date', width: 12 }
      ];

      projectSheet.getRow(1).font = { bold: true };
      projectSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF28A745' }
      };

      projects.projects.forEach(project => {
        projectSheet.addRow({
          project_id: project.project_id,
          name: project.name,
          number: project.number,
          status: project.status,
          location: project.location || '',
          manager_name: project.manager_name || '',
          start_date: project.start_date || '',
          end_date: project.end_date || ''
        });
      });
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `metropower-export-${startDate}-to-${endDate}-${timestamp}.xlsx`;
    const filepath = path.join(process.env.EXPORT_PATH || './exports', filename);

    // Ensure export directory exists
    await fs.mkdir(path.dirname(filepath), { recursive: true });

    // Write file
    await workbook.xlsx.writeFile(filepath);

    logger.logBusiness('excel_export_created', {
      filename,
      startDate,
      endDate,
      userId: req.user.user_id,
      includeEmployees,
      includeProjects,
      includeAssignments
    });

    res.json({
      message: 'Excel export generated successfully',
      filename,
      downloadUrl: `/api/exports/download/${filename}`,
      dateRange: { startDate, endDate }
    });

  } catch (error) {
    logger.error('Excel export error:', error);
    throw new Error('Failed to generate Excel export');
  }
}));

/**
 * @route   POST /api/exports/csv
 * @desc    Generate CSV export
 * @access  Private
 */
router.post('/csv', [
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Start date must be in YYYY-MM-DD format'),
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('End date must be in YYYY-MM-DD format'),
  body('type')
    .optional()
    .isIn(['assignments', 'employees', 'projects'])
    .withMessage('Type must be assignments, employees, or projects')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { startDate, endDate, type = 'assignments' } = req.body;

  try {
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `metropower-${type}-${startDate}-to-${endDate}-${timestamp}.csv`;
    const filepath = path.join(process.env.EXPORT_PATH || './exports', filename);

    // Ensure export directory exists
    await fs.mkdir(path.dirname(filepath), { recursive: true });

    let csvWriter, data;

    switch (type) {
      case 'assignments':
        const assignments = await Assignment.getByDateRange(startDate, endDate);
        csvWriter = createCsvWriter({
          path: filepath,
          header: [
            { id: 'assignment_date', title: 'Assignment Date' },
            { id: 'employee_id', title: 'Employee ID' },
            { id: 'employee_name', title: 'Employee Name' },
            { id: 'position_name', title: 'Position' },
            { id: 'project_id', title: 'Project ID' },
            { id: 'project_name', title: 'Project Name' },
            { id: 'project_number', title: 'Project Number' },
            { id: 'notes', title: 'Notes' }
          ]
        });
        data = assignments;
        break;

      case 'employees':
        const employeeResult = await Employee.getAll();
        csvWriter = createCsvWriter({
          path: filepath,
          header: [
            { id: 'employee_id', title: 'Employee ID' },
            { id: 'name', title: 'Name' },
            { id: 'position_name', title: 'Position' },
            { id: 'status', title: 'Status' },
            { id: 'employee_number', title: 'Employee Number' },
            { id: 'hire_date', title: 'Hire Date' },
            { id: 'phone', title: 'Phone' },
            { id: 'email', title: 'Email' }
          ]
        });
        data = employeeResult.employees;
        break;

      case 'projects':
        const projectResult = await Project.getAll();
        csvWriter = createCsvWriter({
          path: filepath,
          header: [
            { id: 'project_id', title: 'Project ID' },
            { id: 'name', title: 'Name' },
            { id: 'number', title: 'Number' },
            { id: 'status', title: 'Status' },
            { id: 'location', title: 'Location' },
            { id: 'manager_name', title: 'Manager' },
            { id: 'start_date', title: 'Start Date' },
            { id: 'end_date', title: 'End Date' }
          ]
        });
        data = projectResult.projects;
        break;
    }

    await csvWriter.writeRecords(data);

    logger.logBusiness('csv_export_created', {
      filename,
      type,
      startDate,
      endDate,
      userId: req.user.user_id,
      recordCount: data.length
    });

    res.json({
      message: 'CSV export generated successfully',
      filename,
      downloadUrl: `/api/exports/download/${filename}`,
      type,
      recordCount: data.length,
      dateRange: { startDate, endDate }
    });

  } catch (error) {
    logger.error('CSV export error:', error);
    throw new Error('Failed to generate CSV export');
  }
}));

/**
 * @route   GET /api/exports/download/:filename
 * @desc    Download export file
 * @access  Private
 */
router.get('/download/:filename', [
  param('filename')
    .notEmpty()
    .withMessage('Filename is required')
    .matches(/^[a-zA-Z0-9\-_.]+\.(xlsx|csv|pdf|md)$/)
    .withMessage('Invalid filename format')
], asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const filename = req.params.filename;
  const filepath = path.join(process.env.EXPORT_PATH || './exports', filename);

  try {
    // Check if file exists
    await fs.access(filepath);

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case '.csv':
        contentType = 'text/csv';
        break;
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.md':
        contentType = 'text/markdown';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream the file
    const fileStream = require('fs').createReadStream(filepath);
    fileStream.pipe(res);

    logger.logBusiness('export_downloaded', {
      filename,
      userId: req.user.user_id
    });

  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new NotFoundError('Export file not found');
    }
    throw error;
  }
}));

/**
 * @route   GET /api/exports
 * @desc    Get list of available exports
 * @access  Private
 */
router.get('/', asyncHandler(async (req, res) => {
  try {
    const exportDir = process.env.EXPORT_PATH || './exports';
    
    // Ensure directory exists
    await fs.mkdir(exportDir, { recursive: true });
    
    const files = await fs.readdir(exportDir);
    const exportFiles = [];

    for (const file of files) {
      const filepath = path.join(exportDir, file);
      const stats = await fs.stat(filepath);
      
      if (stats.isFile() && /\.(xlsx|csv|pdf|md)$/.test(file)) {
        exportFiles.push({
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          downloadUrl: `/api/exports/download/${file}`
        });
      }
    }

    // Sort by creation date (newest first)
    exportFiles.sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json({
      message: 'Export files retrieved successfully',
      data: exportFiles,
      count: exportFiles.length
    });

  } catch (error) {
    logger.error('Error listing export files:', error);
    throw new Error('Failed to retrieve export files');
  }
}));

module.exports = router;
