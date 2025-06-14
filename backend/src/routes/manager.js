/**
 * Manager Routes
 * 
 * Simple API routes for manager data input and export functionality
 */

const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/employees
 * Get all employees
 */
router.get('/employees', authenticate, asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT 
            e.employee_id,
            e.name,
            e.position_id,
            p.name as position_name,
            e.status,
            e.employee_number,
            e.hire_date,
            e.phone,
            e.email,
            e.notes,
            e.created_at,
            e.updated_at
        FROM employees e
        LEFT JOIN positions p ON e.position_id = p.position_id
        ORDER BY e.name
    `);

    res.json({
        success: true,
        employees: result.rows
    });
}));

/**
 * POST /api/employees
 * Create new employee
 */
router.post('/employees', authenticate, asyncHandler(async (req, res) => {
    const {
        employee_id,
        name,
        position_id,
        status = 'Active',
        employee_number,
        hire_date,
        phone,
        email,
        notes
    } = req.body;

    const result = await query(`
        INSERT INTO employees (
            employee_id, name, position_id, status, employee_number,
            hire_date, phone, email, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
    `, [employee_id, name, position_id, status, employee_number, hire_date, phone, email, notes]);

    logger.info('Employee created', {
        employee_id,
        name,
        created_by: req.user.user_id
    });

    res.json({
        success: true,
        message: 'Employee created successfully',
        employee: result.rows[0]
    });
}));

/**
 * GET /api/projects
 * Get all projects
 */
router.get('/projects', authenticate, asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT 
            p.project_id,
            p.name,
            p.number,
            p.status,
            p.start_date,
            p.end_date,
            p.location,
            p.manager_id,
            p.description,
            p.budget,
            p.created_at,
            p.updated_at
        FROM projects p
        ORDER BY p.name
    `);

    res.json({
        success: true,
        projects: result.rows
    });
}));

/**
 * POST /api/projects
 * Create new project
 */
router.post('/projects', authenticate, asyncHandler(async (req, res) => {
    const {
        project_id,
        name,
        number,
        status = 'Active',
        start_date,
        end_date,
        location,
        description,
        budget
    } = req.body;

    const result = await query(`
        INSERT INTO projects (
            project_id, name, number, status, start_date, end_date,
            location, manager_id, description, budget
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
    `, [project_id, name, number, status, start_date, end_date, location, req.user.user_id, description, budget]);

    logger.info('Project created', {
        project_id,
        name,
        created_by: req.user.user_id
    });

    res.json({
        success: true,
        message: 'Project created successfully',
        project: result.rows[0]
    });
}));

/**
 * GET /api/assignments
 * Get all assignments
 */
router.get('/assignments', authenticate, asyncHandler(async (req, res) => {
    const result = await query(`
        SELECT 
            a.assignment_id,
            a.employee_id,
            e.name as employee_name,
            a.project_id,
            p.name as project_name,
            a.assignment_date,
            a.notes,
            a.created_at,
            a.updated_at
        FROM assignments a
        LEFT JOIN employees e ON a.employee_id = e.employee_id
        LEFT JOIN projects p ON a.project_id = p.project_id
        ORDER BY a.assignment_date DESC, e.name
    `);

    res.json({
        success: true,
        assignments: result.rows
    });
}));

/**
 * POST /api/assignments
 * Create new assignment
 */
router.post('/assignments', authenticate, asyncHandler(async (req, res) => {
    const {
        employee_id,
        project_id,
        assignment_date,
        notes
    } = req.body;

    const result = await query(`
        INSERT INTO assignments (
            employee_id, project_id, assignment_date, created_by, notes
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `, [employee_id, project_id, assignment_date, req.user.user_id, notes]);

    logger.info('Assignment created', {
        employee_id,
        project_id,
        assignment_date,
        created_by: req.user.user_id
    });

    res.json({
        success: true,
        message: 'Assignment created successfully',
        assignment: result.rows[0]
    });
}));

/**
 * GET /api/exports/:type
 * Export data as CSV or Excel
 */
router.get('/exports/:type', authenticate, asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { format = 'csv' } = req.query;

    let data = [];
    let filename = '';
    let headers = [];

    switch (type) {
        case 'employees':
            const empResult = await query(`
                SELECT 
                    e.employee_id,
                    e.name,
                    p.name as position,
                    e.status,
                    e.employee_number,
                    e.hire_date,
                    e.phone,
                    e.email,
                    e.notes
                FROM employees e
                LEFT JOIN positions p ON e.position_id = p.position_id
                ORDER BY e.name
            `);
            data = empResult.rows;
            filename = 'employees';
            headers = ['Employee ID', 'Name', 'Position', 'Status', 'Employee Number', 'Hire Date', 'Phone', 'Email', 'Notes'];
            break;

        case 'projects':
            const projResult = await query(`
                SELECT 
                    p.project_id,
                    p.name,
                    p.number,
                    p.status,
                    p.start_date,
                    p.end_date,
                    p.location,
                    p.description,
                    p.budget
                FROM projects p
                ORDER BY p.name
            `);
            data = projResult.rows;
            filename = 'projects';
            headers = ['Project ID', 'Name', 'Number', 'Status', 'Start Date', 'End Date', 'Location', 'Description', 'Budget'];
            break;

        case 'assignments':
            const assignResult = await query(`
                SELECT 
                    a.assignment_date,
                    e.name as employee_name,
                    e.employee_id,
                    p.name as project_name,
                    p.project_id,
                    a.notes
                FROM assignments a
                LEFT JOIN employees e ON a.employee_id = e.employee_id
                LEFT JOIN projects p ON a.project_id = p.project_id
                ORDER BY a.assignment_date DESC, e.name
            `);
            data = assignResult.rows;
            filename = 'assignments';
            headers = ['Date', 'Employee Name', 'Employee ID', 'Project Name', 'Project ID', 'Notes'];
            break;

        default:
            return res.status(400).json({
                error: 'Invalid export type',
                message: 'Supported types: employees, projects, assignments'
            });
    }

    if (format === 'csv') {
        // Generate CSV
        const csvRows = [];
        csvRows.push(headers.join(','));
        
        data.forEach(row => {
            const values = Object.values(row).map(value => {
                if (value === null || value === undefined) return '';
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvRows.push(values.join(','));
        });

        const csvContent = csvRows.join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
    } else {
        // For now, return JSON (Excel export would require additional library)
        res.json({
            success: true,
            type,
            format,
            data,
            headers,
            count: data.length
        });
    }

    logger.info('Data exported', {
        type,
        format,
        count: data.length,
        exported_by: req.user.user_id
    });
}));

module.exports = router;
