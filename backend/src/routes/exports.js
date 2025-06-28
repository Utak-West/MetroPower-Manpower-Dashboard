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
  const doc = new PDFDocument({
    margin: 50,
    size: 'A4',
    info: {
      Title: title,
      Author: 'MetroPower Dashboard',
      Subject: `${title} - Generated ${new Date().toLocaleDateString()}`,
      Creator: 'MetroPower Dashboard System',
      Producer: 'MetroPower Dashboard System'
    }
  })

  let currentPage = 1
  const totalPages = Math.ceil(data.length / 25) + 1 // Estimate pages

  // Function to add header to each page
  function addPageHeader() {
    const headerY = 30

    // Add logo if available
    try {
      if (fs.existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, 50, headerY, { width: 60, height: 30 })
      }
    } catch (error) {
      logger.warn('Could not load logo for PDF export:', error.message)
    }

    // MetroPower Header
    doc.fontSize(18).font('Helvetica-Bold').fillColor(METROPOWER_COLORS.primary)
       .text('MetroPower', 120, headerY + 5)

    doc.fontSize(12).font('Helvetica').fillColor('#000000')
       .text('Tucker Branch - Manpower Dashboard', 120, headerY + 25)

    // Title and date on right side
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000')
       .text(title, 400, headerY + 5, { align: 'right', width: 150 })

    doc.fontSize(9).font('Helvetica').fillColor('#666666')
       .text(`Generated: ${new Date().toLocaleString()}`, 400, headerY + 25, { align: 'right', width: 150 })

    // Page numbers
    doc.fontSize(9).font('Helvetica').fillColor('#666666')
       .text(`Page ${currentPage} of ${totalPages}`, 400, headerY + 40, { align: 'right', width: 150 })

    // Header line
    doc.strokeColor(METROPOWER_COLORS.primary).lineWidth(2)
       .moveTo(50, headerY + 55).lineTo(550, headerY + 55).stroke()

    return headerY + 70
  }

  // Function to add footer to each page
  function addPageFooter() {
    const footerY = doc.page.height - 50

    doc.strokeColor(METROPOWER_COLORS.tableBorder).lineWidth(1)
       .moveTo(50, footerY - 10).lineTo(550, footerY - 10).stroke()

    doc.fontSize(8).font('Helvetica').fillColor('#666666')
       .text('© 2025 MetroPower - Confidential', 50, footerY, { align: 'left' })
       .text(`Total Records: ${data.length}`, 0, footerY, { align: 'center', width: doc.page.width })
       .text('MetroPower Dashboard System', 0, footerY, { align: 'right', width: doc.page.width - 50 })
  }

  // Start first page
  let currentY = addPageHeader()

  // Calculate column widths based on content
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const columnWidths = headers.map(header => {
    let maxWidth = header.length * 7 // Base width on header length

    // Check data for longer content
    data.slice(0, 10).forEach(row => { // Sample first 10 rows
      const key = header.toLowerCase().replace(/\s+/g, '_')
      const value = (row[key] || '').toString()
      maxWidth = Math.max(maxWidth, value.length * 6)
    })

    return Math.min(maxWidth, pageWidth / headers.length * 1.5)
  })

  // Normalize column widths to fit page
  const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0)
  const scaleFactor = pageWidth / totalWidth
  columnWidths.forEach((width, index) => {
    columnWidths[index] = width * scaleFactor
  })

  // Table headers
  const headerHeight = 25
  const rowHeight = 20

  // Header background
  doc.rect(50, currentY, pageWidth, headerHeight).fillAndStroke(METROPOWER_COLORS.headerBg, METROPOWER_COLORS.tableBorder)

  // Header text
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
  let xPosition = 50
  headers.forEach((header, index) => {
    doc.text(header, xPosition + 5, currentY + 8, {
      width: columnWidths[index] - 10,
      align: 'left',
      ellipsis: true
    })
    xPosition += columnWidths[index]
  })

  currentY += headerHeight

  // Data rows
  doc.fontSize(9).font('Helvetica')

  data.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (currentY + rowHeight > doc.page.height - 100) {
      addPageFooter()
      doc.addPage()
      currentPage++
      currentY = addPageHeader()

      // Re-add table headers on new page
      doc.rect(50, currentY, pageWidth, headerHeight).fillAndStroke(METROPOWER_COLORS.headerBg, METROPOWER_COLORS.tableBorder)
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
      xPosition = 50
      headers.forEach((header, index) => {
        doc.text(header, xPosition + 5, currentY + 8, {
          width: columnWidths[index] - 10,
          align: 'left',
          ellipsis: true
        })
        xPosition += columnWidths[index]
      })
      currentY += headerHeight
      doc.fontSize(9).font('Helvetica')
    }

    // Alternate row colors
    const rowColor = rowIndex % 2 === 0 ? '#FFFFFF' : '#F8F9FA'
    doc.rect(50, currentY, pageWidth, rowHeight).fillAndStroke(rowColor, METROPOWER_COLORS.tableBorder)

    // Row data
    xPosition = 50
    headers.forEach((header, colIndex) => {
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

      doc.fillColor('#000000').text(value.toString(), xPosition + 5, currentY + 6, {
        width: columnWidths[colIndex] - 10,
        align: 'left',
        ellipsis: true
      })
      xPosition += columnWidths[colIndex]
    })

    currentY += rowHeight
  })

  // Add footer to last page
  addPageFooter()

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
        const doc = generatePDF(exportData, headers, 'MetroPower Staff Directory', {
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
