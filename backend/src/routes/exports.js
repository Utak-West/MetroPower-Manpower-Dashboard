/**
 * Export Routes
 *
 * Handles data export endpoints for the MetroPower Dashboard API
 * Enhanced with comprehensive PDF and Excel generation capabilities
 *
 * Copyright 2025 The HigherSelf Network
 */

const express = require('express')
const ExcelJS = require('exceljs')
const PDFDocument = require('pdfkit')
const path = require('path')
const fs = require('fs')
const { asyncHandler } = require('../middleware/errorHandler')
const { authenticate } = require('../middleware/auth')
const logger = require('../utils/logger')

const router = express.Router()

// MetroPower branding constants
const METROPOWER_COLORS = {
  primary: '#DC3545',
  secondary: '#6C757D',
  success: '#28A745',
  info: '#17A2B8',
  warning: '#FFC107',
  danger: '#DC3545',
  light: '#F8F9FA',
  dark: '#343A40',
  headerBg: '#F8F9FA',
  tableBorder: '#DEE2E6'
}

// Logo path (relative to backend root)
const LOGO_PATH = path.join(__dirname, '../../..', 'frontend/assets/images/metropower-logo.png')

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
 * Generate Excel workbook from data with enhanced formatting and branding
 */
async function generateExcel(data, headers, sheetName = 'Data', options = {}) {
  const workbook = new ExcelJS.Workbook()

  // Set workbook properties
  workbook.creator = 'MetroPower Dashboard'
  workbook.lastModifiedBy = 'MetroPower Dashboard'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.company = 'MetroPower'

  const worksheet = workbook.addWorksheet(sheetName)

  // Add MetroPower header section
  const titleRow = worksheet.addRow(['MetroPower Dashboard'])
  titleRow.getCell(1).font = {
    size: 18,
    bold: true,
    color: { argb: METROPOWER_COLORS.primary.replace('#', 'FF') }
  }
  titleRow.getCell(1).alignment = { horizontal: 'center' }

  const subtitleRow = worksheet.addRow([options.reportTitle || `${sheetName} Report`])
  subtitleRow.getCell(1).font = { size: 14, bold: true }
  subtitleRow.getCell(1).alignment = { horizontal: 'center' }

  const dateRow = worksheet.addRow([`Generated: ${new Date().toLocaleString()}`])
  dateRow.getCell(1).font = { size: 10, italic: true }
  dateRow.getCell(1).alignment = { horizontal: 'center' }

  const countRow = worksheet.addRow([`Total Records: ${data.length}`])
  countRow.getCell(1).font = { size: 10, italic: true }
  countRow.getCell(1).alignment = { horizontal: 'center' }

  // Add empty row for spacing
  worksheet.addRow([])

  // Merge cells for header section
  const headerColCount = Math.max(headers.length, 6)
  worksheet.mergeCells(1, 1, 1, headerColCount)
  worksheet.mergeCells(2, 1, 2, headerColCount)
  worksheet.mergeCells(3, 1, 3, headerColCount)
  worksheet.mergeCells(4, 1, 4, headerColCount)

  // Add column headers
  const headerRow = worksheet.addRow(headers)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: METROPOWER_COLORS.primary.replace('#', 'FF') }
  }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
  headerRow.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  }

  // Add data rows with alternating colors
  data.forEach((row, index) => {
    const values = headers.map(header => {
      const key = header.toLowerCase().replace(/\s+/g, '_')
      let value = row[key] || ''

      // Format dates
      if (value && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        try {
          value = new Date(value).toLocaleDateString()
        } catch (e) {
          // Keep original value if date parsing fails
        }
      }

      return value
    })

    const dataRow = worksheet.addRow(values)

    // Alternate row colors
    if (index % 2 === 1) {
      dataRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8F9FA' }
      }
    }

    // Add borders
    dataRow.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
      cell.alignment = { vertical: 'middle' }
    })
  })

  // Auto-fit columns with better sizing
  worksheet.columns.forEach((column, index) => {
    let maxLength = headers[index] ? headers[index].length : 10

    column.eachCell({ includeEmpty: false }, cell => {
      const columnLength = cell.value ? cell.value.toString().length : 0
      if (columnLength > maxLength) {
        maxLength = columnLength
      }
    })

    // Set minimum and maximum column widths
    column.width = Math.max(Math.min(maxLength + 3, 50), 12)
  })

  // Add footer with MetroPower branding
  const footerRowIndex = worksheet.rowCount + 2
  const footerRow = worksheet.addRow(['© 2025 MetroPower - Tucker Branch'])
  footerRow.getCell(1).font = { size: 9, italic: true }
  footerRow.getCell(1).alignment = { horizontal: 'center' }
  worksheet.mergeCells(footerRowIndex, 1, footerRowIndex, headerColCount)

  return workbook
}

/**
 * Generate PDF document from data with enhanced formatting and branding
 */
function generatePDF(data, headers, title = 'Report', options = {}) {
  // PDF Layout Constants - Improved spacing and margins
  const PAGE_WIDTH = 595.28  // A4 width in points
  const PAGE_HEIGHT = 841.89 // A4 height in points
  const MARGIN = 45          // Increased margin for better spacing
  const HEADER_HEIGHT = 80   // Slightly increased for better header spacing
  const FOOTER_HEIGHT = 30   // Increased for better footer spacing
  const TABLE_HEADER_HEIGHT = 32  // Increased for better header readability
  const ROW_HEIGHT = 26      // Significantly increased for better row spacing
  const ROW_SPACING = 2      // Additional space between rows
  const CELL_PADDING = 6     // Increased internal cell padding
  const MIN_COLUMN_WIDTH = 60    // Increased minimum width
  const MAX_COLUMN_WIDTH = 180   // Increased maximum width to accommodate email addresses
  const COLUMN_SPACING = 2   // Space between columns

  const doc = new PDFDocument({
    margin: MARGIN,
    size: 'A4',
    info: {
      Title: title,
      Author: 'MetroPower Dashboard',
      Subject: `${title} - Generated ${new Date().toLocaleDateString()}`,
      Creator: 'MetroPower Dashboard System',
      Producer: 'MetroPower Dashboard System'
    }
  })

  // Calculate available content area
  const contentWidth = PAGE_WIDTH - (MARGIN * 2)
  const availableContentHeight = PAGE_HEIGHT - (MARGIN * 2) - HEADER_HEIGHT - FOOTER_HEIGHT
  const rowsPerPage = Math.floor((availableContentHeight - TABLE_HEADER_HEIGHT) / ROW_HEIGHT)
  const totalPages = Math.ceil(data.length / rowsPerPage)

  let currentPage = 1

  // Calculate optimal column widths with improved distribution
  function calculateOptimalColumnWidths() {
    const columnWidths = []
    let totalContentWidth = 0

    // First pass: calculate content-based widths with column-specific optimization
    headers.forEach((header, index) => {
      let maxWidth = header.length * 7 // Base width multiplier

      // Column-specific width optimization with Department removed for email space
      const headerLower = header.toLowerCase()
      if (headerLower.includes('id')) {
        maxWidth = Math.min(maxWidth, 75) // Slightly increased ID column width
      } else if (headerLower.includes('email')) {
        maxWidth = Math.max(maxWidth, 170) // Significantly increased email column width for full display
      } else if (headerLower.includes('phone')) {
        maxWidth = Math.max(maxWidth, 110) // Increased phone column width
      } else if (headerLower.includes('first') || headerLower.includes('last')) {
        maxWidth = Math.max(maxWidth, 85) // Ensure adequate space for names
      } else if (headerLower.includes('position')) {
        maxWidth = Math.max(maxWidth, 95) // Ensure adequate space for position titles
      }

      // Sample data to determine content width (check first 30 rows for better accuracy)
      const sampleSize = Math.min(data.length, 30)
      for (let i = 0; i < sampleSize; i++) {
        const key = header.toLowerCase().replace(/\s+/g, '_')
        const value = (data[i][key] || '').toString()
        // Improved width calculation considering character width variations
        maxWidth = Math.max(maxWidth, value.length * 6.5)
      }

      // Apply min/max constraints with better distribution
      maxWidth = Math.max(MIN_COLUMN_WIDTH, Math.min(maxWidth, MAX_COLUMN_WIDTH))
      columnWidths[index] = maxWidth
      totalContentWidth += maxWidth
    })

    // Account for column spacing in total width calculation
    const totalSpacing = (headers.length - 1) * COLUMN_SPACING
    const availableContentWidth = contentWidth - totalSpacing

    // Second pass: scale to fit available width with spacing consideration
    if (totalContentWidth !== availableContentWidth) {
      const scaleFactor = availableContentWidth / totalContentWidth
      for (let i = 0; i < columnWidths.length; i++) {
        columnWidths[i] = Math.floor(columnWidths[i] * scaleFactor)
      }

      // Adjust last column to ensure exact fit
      const currentTotal = columnWidths.reduce((sum, width) => sum + width, 0)
      const adjustment = availableContentWidth - currentTotal
      columnWidths[columnWidths.length - 1] += adjustment
    }

    return columnWidths
  }

  // Optimized header function with proper spacing between all elements
  function addOptimizedPageHeader() {
    const headerY = MARGIN

    // Add logo if available with proper positioning and spacing
    try {
      if (fs.existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, MARGIN, headerY + 3, { width: 50, height: 25 })
      }
    } catch (error) {
      logger.warn('Could not load logo for PDF export:', error.message)
    }

    // MetroPower Header with proper spacing from logo
    doc.fontSize(16).font('Helvetica-Bold').fillColor(METROPOWER_COLORS.primary)
       .text('MetroPower', MARGIN + 65, headerY + 8)

    // Subtitle with adequate spacing from main title
    doc.fontSize(10).font('Helvetica').fillColor('#000000')
       .text('Tucker Branch - Manpower Dashboard', MARGIN + 65, headerY + 28)

    // Title and info on right side with proper alignment and spacing
    const rightX = PAGE_WIDTH - MARGIN - 160
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000')
       .text(title, rightX, headerY + 8, { align: 'right', width: 160 })

    // Generated date and page info with proper vertical spacing
    doc.fontSize(8).font('Helvetica').fillColor('#666666')
       .text(`Generated: ${new Date().toLocaleDateString()}`, rightX, headerY + 26, { align: 'right', width: 160 })
       .text(`Page ${currentPage} of ${totalPages}`, rightX, headerY + 40, { align: 'right', width: 160 })

    // Header line with proper spacing from content above
    doc.strokeColor(METROPOWER_COLORS.primary).lineWidth(1)
       .moveTo(MARGIN, headerY + 55).lineTo(PAGE_WIDTH - MARGIN, headerY + 55).stroke()

    return headerY + HEADER_HEIGHT
  }

  // Optimized footer function with improved spacing
  function addOptimizedPageFooter() {
    const footerY = PAGE_HEIGHT - MARGIN - FOOTER_HEIGHT

    // Footer line with better positioning
    doc.strokeColor(METROPOWER_COLORS.tableBorder).lineWidth(0.5)
       .moveTo(MARGIN, footerY + 5).lineTo(PAGE_WIDTH - MARGIN, footerY + 5).stroke()

    // Footer text with improved spacing and alignment
    doc.fontSize(8).font('Helvetica').fillColor('#666666')
       .text('© 2025 MetroPower - Confidential', MARGIN, footerY + 12, { align: 'left' })
       .text(`Total Records: ${data.length}`, 0, footerY + 12, { align: 'center', width: PAGE_WIDTH })
       .text('MetroPower Dashboard System', 0, footerY + 12, { align: 'right', width: PAGE_WIDTH - MARGIN })
  }

  // Get optimal column widths
  const columnWidths = calculateOptimalColumnWidths()

  // Start first page
  let currentY = addOptimizedPageHeader()

  // Function to add table header with improved spacing
  function addTableHeader() {
    // Header background with better styling and spacing
    doc.rect(MARGIN, currentY, contentWidth, TABLE_HEADER_HEIGHT)
       .fillAndStroke(METROPOWER_COLORS.headerBg, METROPOWER_COLORS.tableBorder)

    // Draw column separators in header for consistency
    let separatorX = MARGIN
    for (let i = 0; i < columnWidths.length - 1; i++) {
      separatorX += columnWidths[i] + COLUMN_SPACING
      doc.strokeColor(METROPOWER_COLORS.tableBorder).lineWidth(0.5)
         .moveTo(separatorX - COLUMN_SPACING/2, currentY)
         .lineTo(separatorX - COLUMN_SPACING/2, currentY + TABLE_HEADER_HEIGHT)
         .stroke()
    }

    // Header text with reduced font size for better information density
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000')
    let xPosition = MARGIN
    headers.forEach((header, index) => {
      const cellWidth = columnWidths[index]
      // Improved vertical centering and padding with smaller font
      const textY = currentY + (TABLE_HEADER_HEIGHT - 8) / 2 + 3
      doc.text(header, xPosition + CELL_PADDING, textY, {
        width: cellWidth - (CELL_PADDING * 2),
        align: 'center',
        ellipsis: true
      })
      xPosition += cellWidth + COLUMN_SPACING
    })

    currentY += TABLE_HEADER_HEIGHT
  }

  // Add initial table header
  addTableHeader()

  // Process data rows with optimized pagination and reduced font size
  doc.fontSize(7).font('Helvetica')

  data.forEach((row, rowIndex) => {
    // Check if we need a new page with improved spacing calculation
    const remainingSpace = PAGE_HEIGHT - MARGIN - FOOTER_HEIGHT - currentY
    if (remainingSpace < ROW_HEIGHT + ROW_SPACING + 15) { // Account for row spacing in page breaks
      addOptimizedPageFooter()
      doc.addPage()
      currentPage++
      currentY = addOptimizedPageHeader()
      addTableHeader()
    }

    // Alternate row colors with improved styling
    const rowColor = rowIndex % 2 === 0 ? '#FFFFFF' : '#F8F9FA'
    doc.rect(MARGIN, currentY, contentWidth, ROW_HEIGHT)
       .fillAndStroke(rowColor, METROPOWER_COLORS.tableBorder)

    // Draw column separators for better table structure
    let separatorX = MARGIN
    for (let i = 0; i < columnWidths.length - 1; i++) {
      separatorX += columnWidths[i] + COLUMN_SPACING
      doc.strokeColor(METROPOWER_COLORS.tableBorder).lineWidth(0.5)
         .moveTo(separatorX - COLUMN_SPACING/2, currentY)
         .lineTo(separatorX - COLUMN_SPACING/2, currentY + ROW_HEIGHT)
         .stroke()
    }

    // Row data with enhanced formatting and spacing
    let xPosition = MARGIN
    headers.forEach((header, colIndex) => {
      const key = header.toLowerCase().replace(/\s+/g, '_')
      let value = row[key] || ''

      // Enhanced date formatting
      if (value && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        try {
          value = new Date(value).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        } catch (e) {
          // Keep original value if date parsing fails
        }
      }

      // Improved text handling with proper cell padding and alignment
      const cellWidth = columnWidths[colIndex]
      let displayValue = value.toString()

      // Special handling for email and phone fields to ensure single line display
      const headerLower = header.toLowerCase()
      if (headerLower.includes('email') || headerLower.includes('phone')) {
        // Ensure no line breaks in email/phone fields
        displayValue = displayValue.replace(/\s+/g, ' ').trim()
      }

      // Better vertical centering and horizontal padding with smaller font
      const textY = currentY + (ROW_HEIGHT - 7) / 2 + 3
      // Ensure all text uses regular font weight (no bold) and stays on one line
      doc.font('Helvetica').fillColor('#000000').text(displayValue, xPosition + CELL_PADDING, textY, {
        width: cellWidth - (CELL_PADDING * 2),
        align: 'left',
        ellipsis: true,
        lineBreak: false,
        continued: false
      })

      xPosition += cellWidth + COLUMN_SPACING
    })

    currentY += ROW_HEIGHT + ROW_SPACING  // Add spacing between rows
  })

  // Add footer to last page
  addOptimizedPageFooter()

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
        const workbook = await generateExcel(exportData, headers, 'Assignments', {
          reportTitle: 'MetroPower Assignments Report'
        })

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename="assignments_${timestamp}.xlsx"`)

        await workbook.xlsx.write(res)
        res.end()
      } else if (format === 'pdf') {
        const doc = generatePDF(exportData, headers, 'MetroPower Assignments Report', {
          reportType: 'assignments'
        })

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
        const workbook = await generateExcel(exportData, headers, 'Employees', {
          reportTitle: 'MetroPower Staff Directory'
        })

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename="employees_${timestamp}.xlsx"`)

        await workbook.xlsx.write(res)
        res.end()
      } else if (format === 'pdf') {
        // Optimized data structure for PDF with prioritized columns (Department removed)
        const pdfExportData = employees.map(employee => ({
          employee_id: employee.employee_id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          phone: employee.phone,
          position: employee.position
          // Removed: department, hire_date, is_active, skills for better space utilization
        }))

        // Prioritized headers for PDF export (Department removed for email space)
        const pdfHeaders = [
          'Employee ID',
          'First Name',
          'Last Name',
          'Email',
          'Phone',
          'Position'
        ]

        const doc = generatePDF(pdfExportData, pdfHeaders, 'MetroPower Staff Directory', {
          reportType: 'employees'
        })

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

/**
 * @route   GET /api/exports/projects
 * @desc    Export projects data
 * @access  Private
 */
router.get('/projects', authenticate, asyncHandler(async (req, res) => {
  try {
    const { format = 'csv' } = req.query

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')
      const projects = await demoService.getProjects()

      // Prepare data for export
      const exportData = projects.map(project => ({
        project_id: project.project_id,
        project_name: project.name,
        project_number: project.number || project.project_id,
        location: project.location || 'Not specified',
        status: project.status || 'Unknown',
        description: project.description || '',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        budget: project.budget || '',
        manager: project.manager || '',
        created_at: project.created_at || '',
        updated_at: project.updated_at || ''
      }))

      const headers = [
        'Project ID',
        'Project Name',
        'Project Number',
        'Location',
        'Status',
        'Description',
        'Start Date',
        'End Date',
        'Budget',
        'Manager',
        'Created At',
        'Updated At'
      ]

      const timestamp = new Date().toISOString().split('T')[0]

      if (format === 'csv') {
        const csvContent = convertToCSV(exportData, headers)

        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', `attachment; filename="projects_${timestamp}.csv"`)
        res.send(csvContent)
      } else if (format === 'excel') {
        const workbook = await generateExcel(exportData, headers, 'Projects', {
          reportTitle: 'MetroPower Projects Report'
        })

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename="projects_${timestamp}.xlsx"`)

        await workbook.xlsx.write(res)
        res.end()
      } else if (format === 'pdf') {
        const doc = generatePDF(exportData, headers, 'MetroPower Projects Report', {
          reportType: 'projects'
        })

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="projects_${timestamp}.pdf"`)

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

      logger.info('Projects exported', {
        format,
        count: exportData.length,
        exported_by: req.user?.user_id
      })

      return
    }

    // Database mode implementation would go here
    res.status(501).json({
      error: 'Not implemented',
      message: 'Project export not yet implemented for database mode'
    })
  } catch (error) {
    logger.error('Error exporting projects:', error)
    res.status(500).json({
      error: 'Export error',
      message: 'Failed to export projects'
    })
  }
}))

/**
 * @route   GET /api/exports/dashboard
 * @desc    Export comprehensive dashboard data
 * @access  Private
 */
router.get('/dashboard', authenticate, asyncHandler(async (req, res) => {
  try {
    const { format = 'excel', weekStart } = req.query

    if (global.isDemoMode) {
      const demoService = require('../services/demoService')

      // Get comprehensive dashboard data
      const [
        assignments,
        employees,
        projects,
        metrics
      ] = await Promise.all([
        demoService.getAssignments(),
        demoService.getEmployees(),
        demoService.getProjects(),
        demoService.getDashboardMetrics()
      ])

      // Filter assignments by week if specified
      let filteredAssignments = assignments
      if (weekStart) {
        const weekStartDate = new Date(weekStart)
        const weekEndDate = new Date(weekStartDate)
        weekEndDate.setDate(weekEndDate.getDate() + 6)

        filteredAssignments = assignments.filter(assignment => {
          const assignmentDate = new Date(assignment.date)
          return assignmentDate >= weekStartDate && assignmentDate <= weekEndDate
        })
      }

      const timestamp = new Date().toISOString().split('T')[0]

      if (format === 'excel') {
        // Create multi-sheet Excel workbook
        const workbook = new ExcelJS.Workbook()

        // Set workbook properties
        workbook.creator = 'MetroPower Dashboard'
        workbook.company = 'MetroPower'
        workbook.created = new Date()

        // Dashboard Summary Sheet
        const summarySheet = workbook.addWorksheet('Dashboard Summary')

        // Add MetroPower header
        const titleRow = summarySheet.addRow(['MetroPower Dashboard Summary'])
        titleRow.getCell(1).font = { size: 18, bold: true, color: { argb: METROPOWER_COLORS.primary.replace('#', 'FF') }}
        titleRow.getCell(1).alignment = { horizontal: 'center' }
        summarySheet.mergeCells(1, 1, 1, 4)

        summarySheet.addRow([`Generated: ${new Date().toLocaleString()}`])
        summarySheet.addRow([weekStart ? `Week of: ${weekStart}` : 'All Data'])
        summarySheet.addRow([]) // Empty row

        // Add summary statistics
        summarySheet.addRow(['Metric', 'Value'])
        const headerRow = summarySheet.getRow(5)
        headerRow.font = { bold: true }
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: METROPOWER_COLORS.primary.replace('#', 'FF') }}

        summarySheet.addRow(['Total Employees', employees.length])
        summarySheet.addRow(['Active Projects', projects.filter(p => p.status === 'Active').length])
        summarySheet.addRow(['Total Assignments', filteredAssignments.length])
        summarySheet.addRow(['Unassigned Today', metrics.unassignedToday.length])

        // Auto-fit columns
        summarySheet.columns = [
          { width: 25 },
          { width: 15 }
        ]

        // Assignments Sheet
        if (filteredAssignments.length > 0) {
          const assignmentData = filteredAssignments.map(assignment => ({
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

          const assignmentHeaders = [
            'Assignment Date', 'Employee Name', 'Employee Position', 'Project Name',
            'Project Location', 'Task Description', 'Location', 'Notes', 'Status'
          ]

          const assignmentSheet = workbook.addWorksheet('Assignments')
          await addDataToWorksheet(assignmentSheet, assignmentData, assignmentHeaders, 'Weekly Assignments')
        }

        // Employees Sheet
        const employeeData = employees.map(employee => ({
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

        const employeeHeaders = [
          'Employee ID', 'First Name', 'Last Name', 'Email', 'Phone',
          'Position', 'Department', 'Hire Date', 'Status', 'Skills'
        ]

        const employeeSheet = workbook.addWorksheet('Employees')
        await addDataToWorksheet(employeeSheet, employeeData, employeeHeaders, 'Employee Directory')

        // Projects Sheet
        const projectData = projects.map(project => ({
          project_id: project.project_id,
          project_name: project.name,
          project_number: project.number || project.project_id,
          location: project.location || 'Not specified',
          status: project.status || 'Unknown',
          description: project.description || '',
          start_date: project.start_date || '',
          end_date: project.end_date || ''
        }))

        const projectHeaders = [
          'Project ID', 'Project Name', 'Project Number', 'Location',
          'Status', 'Description', 'Start Date', 'End Date'
        ]

        const projectSheet = workbook.addWorksheet('Projects')
        await addDataToWorksheet(projectSheet, projectData, projectHeaders, 'Project Directory')

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename="dashboard_comprehensive_${timestamp}.xlsx"`)

        await workbook.xlsx.write(res)
        res.end()

      } else if (format === 'pdf') {
        // Create comprehensive PDF report
        const doc = new PDFDocument({ margin: 50, size: 'A4' })

        // Add dashboard summary data
        const summaryData = [
          { metric: 'Total Employees', value: employees.length },
          { metric: 'Active Projects', value: projects.filter(p => p.status === 'Active').length },
          { metric: 'Total Assignments', value: filteredAssignments.length },
          { metric: 'Unassigned Today', value: metrics.unassignedToday.length }
        ]

        const summaryHeaders = ['Metric', 'Value']
        const summaryDoc = generatePDF(summaryData, summaryHeaders, 'MetroPower Dashboard Summary', {
          reportType: 'dashboard'
        })

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="dashboard_summary_${timestamp}.pdf"`)

        summaryDoc.pipe(res)
        summaryDoc.end()

      } else {
        res.json({
          success: true,
          data: {
            summary: {
              total_employees: employees.length,
              active_projects: projects.filter(p => p.status === 'Active').length,
              total_assignments: filteredAssignments.length,
              unassigned_today: metrics.unassignedToday.length
            },
            assignments: filteredAssignments,
            employees,
            projects
          },
          isDemoMode: true
        })
      }

      logger.info('Dashboard exported', {
        format,
        weekStart,
        exported_by: req.user?.user_id
      })

      return
    }

    // Database mode implementation would go here
    res.status(501).json({
      error: 'Not implemented',
      message: 'Dashboard export not yet implemented for database mode'
    })
  } catch (error) {
    logger.error('Error exporting dashboard:', error)
    res.status(500).json({
      error: 'Export error',
      message: 'Failed to export dashboard'
    })
  }
}))

/**
 * Helper function to add data to Excel worksheet with formatting
 */
async function addDataToWorksheet(worksheet, data, headers, title) {
  // Add title
  const titleRow = worksheet.addRow([title])
  titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: METROPOWER_COLORS.primary.replace('#', 'FF') }}
  titleRow.getCell(1).alignment = { horizontal: 'center' }
  worksheet.mergeCells(1, 1, 1, headers.length)

  // Add generation date
  const dateRow = worksheet.addRow([`Generated: ${new Date().toLocaleString()}`])
  dateRow.getCell(1).font = { size: 10, italic: true }
  dateRow.getCell(1).alignment = { horizontal: 'center' }
  worksheet.mergeCells(2, 1, 2, headers.length)

  worksheet.addRow([]) // Empty row

  // Add headers
  const headerRow = worksheet.addRow(headers)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }}
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: METROPOWER_COLORS.primary.replace('#', 'FF') }}
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }

  // Add data
  data.forEach((row, index) => {
    const values = headers.map(header => {
      const key = header.toLowerCase().replace(/\s+/g, '_')
      return row[key] || ''
    })

    const dataRow = worksheet.addRow(values)

    // Alternate row colors
    if (index % 2 === 1) {
      dataRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' }}
    }
  })

  // Auto-fit columns
  worksheet.columns.forEach((column, index) => {
    let maxLength = headers[index] ? headers[index].length : 10

    column.eachCell({ includeEmpty: false }, cell => {
      const columnLength = cell.value ? cell.value.toString().length : 0
      if (columnLength > maxLength) {
        maxLength = columnLength
      }
    })

    column.width = Math.max(Math.min(maxLength + 3, 50), 12)
  })
}

module.exports = router
