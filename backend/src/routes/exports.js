/**
 * Export Routes
 *
 * Handles data export endpoints for the MetroPower Dashboard API
 *
 * Copyright 2025 The HigherSelf Network
 */

const express = require('express')
const ExcelJS = require('exceljs')
const PDFDocument = require('pdfkit')
const { asyncHandler } = require('../middleware/errorHandler')
const { authenticate } = require('../middleware/auth')
const logger = require('../utils/logger')

const router = express.Router()

/**
 * Convert data to CSV format
 */
function convertToCSV(data, headers) {
  if (!data || data.length === 0) {
    return headers.join(',') + '\n'
  }

  const csvRows = []
  csvRows.push(headers.join(','))

  data.forEach(row => {
    const values = headers.map(header => {
      const key = header.toLowerCase().replace(/\s+/g, '_')
      let value = row[key] || ''

      // Handle nested objects
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value)
      }

      // Escape CSV values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        value = `"${value.replace(/"/g, '""')}"`
      }

      return value
    })
    csvRows.push(values.join(','))
  })

  return csvRows.join('\n')
}

/**
 * Generate Excel workbook from data
 */
async function generateExcel(data, headers, sheetName = 'Data') {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)

  // Add headers
  worksheet.addRow(headers)

  // Style headers
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' }
  }

  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const key = header.toLowerCase().replace(/\s+/g, '_')
      return row[key] || ''
    })
    worksheet.addRow(values)
  })

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    let maxLength = 0
    column.eachCell({ includeEmpty: true }, cell => {
      const columnLength = cell.value ? cell.value.toString().length : 10
      if (columnLength > maxLength) {
        maxLength = columnLength
      }
    })
    column.width = Math.min(maxLength + 2, 50)
  })

  return workbook
}

/**
 * Generate PDF document from data
 */
function generatePDF(data, headers, title = 'Report') {
  const doc = new PDFDocument({ margin: 50 })

  // Title
  doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' })
  doc.moveDown()

  // Date
  doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' })
  doc.moveDown()

  // Table setup
  const tableTop = doc.y
  const itemHeight = 20
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const columnWidth = pageWidth / headers.length

  // Headers
  doc.fontSize(10).font('Helvetica-Bold')
  headers.forEach((header, i) => {
    doc.text(header, doc.page.margins.left + (i * columnWidth), tableTop, {
      width: columnWidth,
      align: 'left'
    })
  })

  // Header line
  doc.moveTo(doc.page.margins.left, tableTop + 15)
     .lineTo(doc.page.width - doc.page.margins.right, tableTop + 15)
     .stroke()

  // Data rows
  doc.font('Helvetica')
  let currentY = tableTop + itemHeight

  data.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (currentY > doc.page.height - doc.page.margins.bottom - itemHeight) {
      doc.addPage()
      currentY = doc.page.margins.top
    }

    headers.forEach((header, colIndex) => {
      const key = header.toLowerCase().replace(/\s+/g, '_')
      const value = row[key] || ''

      doc.text(value.toString(), doc.page.margins.left + (colIndex * columnWidth), currentY, {
        width: columnWidth,
        align: 'left'
      })
    })

    currentY += itemHeight
  })

  return doc
}

/**
 * @route   GET /api/exports/assignments
 * @desc    Export assignments data
 * @access  Private
 */
router.get('/assignments', authenticate, asyncHandler(async (req, res) => {
  try {
    const { format = 'csv' } = req.query

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const assignments = await demoService.getAssignments()

      // Prepare data for export
      const exportData = assignments.map(assignment => ({
        assignment_date: assignment.date,
        employee_name: assignment.employee ? `${assignment.employee.first_name} ${assignment.employee.last_name}` : 'Unknown',
        employee_position: assignment.employee ? assignment.employee.position : 'Unknown',
        project_name: assignment.project ? assignment.project.name : 'Unknown',
        project_location: assignment.project ? assignment.project.location : 'Unknown',
        task_description: assignment.task_description || '',
        location: assignment.location || '',
        notes: assignment.notes || '',
        status: assignment.status || 'Unknown'
      }))

      const headers = [
        'Assignment Date',
        'Employee Name',
        'Employee Position',
        'Project Name',
        'Project Location',
        'Task Description',
        'Location',
        'Notes',
        'Status'
      ]

      const timestamp = new Date().toISOString().split('T')[0]

      if (format === 'csv') {
        const csvContent = convertToCSV(exportData, headers)

        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', `attachment; filename="assignments_${timestamp}.csv"`)
        res.send(csvContent)
      } else if (format === 'excel') {
        const workbook = await generateExcel(exportData, headers, 'Assignments')

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename="assignments_${timestamp}.xlsx"`)

        await workbook.xlsx.write(res)
        res.end()
      } else if (format === 'pdf') {
        const doc = generatePDF(exportData, headers, 'MetroPower Assignments Report')

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="assignments_${timestamp}.pdf"`)

        doc.pipe(res)
        doc.end()
      } else {
        res.json({
          success: true,
          data: exportData,
          headers,
          count: exportData.length,
          isDemoMode: true
        })
      }

      logger.info('Assignments exported', {
        format,
        count: exportData.length,
        exported_by: req.user?.user_id
      })

      return
    }

    // Database mode implementation would go here
    res.status(501).json({
      error: 'Not implemented',
      message: 'Assignment export not yet implemented for database mode'
    })
  } catch (error) {
    logger.error('Error exporting assignments:', error)
    res.status(500).json({
      error: 'Export error',
      message: 'Failed to export assignments'
    })
  }
}))

/**
 * @route   GET /api/exports/employees
 * @desc    Export employees data
 * @access  Private
 */
router.get('/employees', authenticate, asyncHandler(async (req, res) => {
  try {
    const { format = 'csv' } = req.query

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const employees = await demoService.getEmployees()

      const exportData = employees.map(employee => ({
        employee_id: employee.employee_id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone,
        position: employee.position,
        department: employee.department,
        hire_date: employee.hire_date,
        is_active: employee.is_active ? 'Active' : 'Inactive',
        skills: employee.skills ? employee.skills.join(', ') : ''
      }))

      const headers = [
        'Employee ID',
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Position',
        'Department',
        'Hire Date',
        'Status',
        'Skills'
      ]

      const timestamp = new Date().toISOString().split('T')[0]

      if (format === 'csv') {
        const csvContent = convertToCSV(exportData, headers)

        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', `attachment; filename="employees_${timestamp}.csv"`)
        res.send(csvContent)
      } else if (format === 'excel') {
        const workbook = await generateExcel(exportData, headers, 'Employees')

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename="employees_${timestamp}.xlsx"`)

        await workbook.xlsx.write(res)
        res.end()
      } else if (format === 'pdf') {
        const doc = generatePDF(exportData, headers, 'MetroPower Staff Directory')

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="employees_${timestamp}.pdf"`)

        doc.pipe(res)
        doc.end()
      } else {
        res.json({
          success: true,
          data: exportData,
          headers,
          count: exportData.length,
          isDemoMode: true
        })
      }

      logger.info('Employees exported', {
        format,
        count: exportData.length,
        exported_by: req.user?.user_id
      })

      return
    }

    // Database mode implementation would go here
    res.status(501).json({
      error: 'Not implemented',
      message: 'Employee export not yet implemented for database mode'
    })
  } catch (error) {
    logger.error('Error exporting employees:', error)
    res.status(500).json({
      error: 'Export error',
      message: 'Failed to export employees'
    })
  }
}))

module.exports = router
