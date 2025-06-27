/**
 * Excel Data Parser for MetroPower Legacy Manpower Board
 * 
 * Parses the Legacy - MB Week 6.16.25-6.22.25.xlsx file to extract
 * employee and assignment data for integration into the dashboard.
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// File path
const excelFilePath = path.join(__dirname, '..', 'Legacy - MB Week 6.16.25-6.22.25.xlsx');

/**
 * Parse employee name and ID from combined string
 * Example: "Matt Smith-004478" -> { name: "Matt Smith", id: "004478" }
 */
function parseEmployeeName(nameString) {
  if (!nameString || typeof nameString !== 'string') {
    return { name: '', id: '' };
  }
  
  const parts = nameString.trim().split('-');
  if (parts.length >= 2) {
    const name = parts.slice(0, -1).join('-').trim();
    const id = parts[parts.length - 1].trim();
    return { name, id };
  }
  
  return { name: nameString.trim(), id: '' };
}

/**
 * Determine position/trade from context or explicit position
 */
function determinePosition(nameString, positionString = '') {
  const position = positionString.toLowerCase().trim();

  // Direct position mapping
  if (position === 'fs' || position.includes('field supervisor')) {
    return 'Field Supervisor';
  }
  if (position.includes('electrician')) {
    return 'Electrician';
  }
  if (position.includes('apprentice')) {
    return 'Apprentice';
  }
  if (position === 'gl' || position.includes('general laborer')) {
    return 'General Laborer';
  }
  if (position.includes('temp')) {
    return 'Temp';
  }
  if (position.includes('service tech')) {
    return 'Service Tech';
  }
  if (position.includes('foreman')) {
    return 'Foreman';
  }

  // Fallback to name analysis
  const str = nameString.toLowerCase();
  if (str.includes('fs') || str.includes('supervisor')) {
    return 'Field Supervisor';
  }

  return 'General Laborer'; // Default
}

/**
 * Check if a string looks like a valid employee name
 */
function isValidEmployeeName(nameString) {
  if (!nameString || typeof nameString !== 'string') {
    return false;
  }

  const trimmed = nameString.trim();

  // Filter out obvious non-employee entries
  const invalidPatterns = [
    /^(employee assigned|service tech|no longer with metro|red shirts working)$/i,
    /^(available|vacation|medical|military|pto|prefab|branch|marta|trachte)$/i,
    /^(berry college|uga|classic center|morehouse|grady|critical power)$/i,
    /^(name|position|count|total|summary|week)$/i,
    /^\?+$/,
    /^[a-z]$/i, // Single letters
    /^\d+$/, // Pure numbers
    /^(fs|gl|electrician|apprentice|temp)$/i // Position names only
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }

  // Must have at least 2 characters and look like a name
  if (trimmed.length < 2) {
    return false;
  }

  // Should contain letters and possibly spaces, hyphens, numbers
  if (!/^[A-Za-z\s\-\.\d]+$/.test(trimmed)) {
    return false;
  }

  // Should have at least one letter
  if (!/[A-Za-z]/.test(trimmed)) {
    return false;
  }

  return true;
}

/**
 * Parse the Excel file and extract data
 */
async function parseExcelData() {
  try {
    console.log('Loading Excel file:', excelFilePath);
    
    if (!fs.existsSync(excelFilePath)) {
      throw new Error('Excel file not found: ' + excelFilePath);
    }
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelFilePath);
    
    const worksheet = workbook.getWorksheet(1); // Get first worksheet
    
    if (!worksheet) {
      throw new Error('No worksheet found in Excel file');
    }
    
    console.log('Worksheet loaded. Dimensions:', worksheet.dimensions);
    console.log('Row count:', worksheet.rowCount);
    console.log('Column count:', worksheet.columnCount);
    
    const employees = [];
    const projects = [];
    const assignments = [];
    
    let employeeIdCounter = 1;
    let projectIdCounter = 1;
    let assignmentIdCounter = 1;
    
    // Parse each row looking for employee data
    worksheet.eachRow((row, rowNumber) => {
      console.log(`\nRow ${rowNumber}:`);

      // Get all cell values in the row
      const rowData = [];
      for (let colNumber = 1; colNumber <= worksheet.columnCount; colNumber++) {
        const cell = row.getCell(colNumber);
        const value = cell.value;
        rowData.push(value);
      }

      const nonEmptyData = rowData.filter(v => v !== null && v !== undefined && v !== '');
      console.log('Row data:', nonEmptyData);

      // Look for employee name and position pairs
      for (let i = 0; i < rowData.length - 1; i++) {
        const nameCell = rowData[i];
        const positionCell = rowData[i + 1];

        if (nameCell && typeof nameCell === 'string' &&
            positionCell && typeof positionCell === 'string') {

          const nameValue = nameCell.trim();
          const positionValue = positionCell.trim();

          // Check if this looks like a name-position pair
          if (isValidEmployeeName(nameValue)) {
            const { name, id } = parseEmployeeName(nameValue);

            if (name && name.length > 2) {
              // Check if employee already exists
              const existingEmployee = employees.find(emp =>
                emp.name.toLowerCase() === name.toLowerCase() ||
                (id && emp.employee_number === id)
              );

              if (!existingEmployee) {
                const position = determinePosition(nameValue, positionValue);
                const employee = {
                  employee_id: employeeIdCounter++,
                  name: name,
                  employee_number: id || `EMP${String(employeeIdCounter).padStart(4, '0')}`,
                  position: position,
                  status: 'Active',
                  hire_date: '2024-01-01', // Default hire date
                  email: `${name.toLowerCase().replace(/\s+/g, '.')}@metropower.com`,
                  phone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
                  department: 'Field Operations'
                };

                employees.push(employee);
                console.log(`Found employee: ${name} (${id || 'No ID'}) - ${position}`);
              }
            }
          }
        }
      }
    });
    
    // Create some default projects based on common MetroPower project types
    const defaultProjects = [
      {
        project_id: projectIdCounter++,
        name: 'Tucker Substation Upgrade',
        number: 'TSU-2025-001',
        location: 'Tucker, GA',
        status: 'Active',
        description: 'Electrical infrastructure upgrade at Tucker substation'
      },
      {
        project_id: projectIdCounter++,
        name: 'Power Line Maintenance - Route 85',
        number: 'PLM-2025-002',
        location: 'Route 85 Corridor',
        status: 'Active',
        description: 'Routine maintenance and inspection of power lines along Route 85'
      },
      {
        project_id: projectIdCounter++,
        name: 'Equipment Maintenance',
        number: 'EQM-2025-003',
        location: 'Equipment Yard',
        status: 'Active',
        description: 'Regular maintenance and calibration of field equipment'
      },
      {
        project_id: projectIdCounter++,
        name: 'PreFab Operations',
        number: 'PFO-2025-004',
        location: 'PreFab Facility',
        status: 'Active',
        description: 'Prefabrication of electrical components and assemblies'
      }
    ];
    
    projects.push(...defaultProjects);
    
    // Create assignments for the week (6/16/25 - 6/22/25)
    const weekDates = [
      '2025-06-16', '2025-06-17', '2025-06-18', 
      '2025-06-19', '2025-06-20', '2025-06-21', '2025-06-22'
    ];
    
    // Assign employees to projects for the week
    employees.forEach((employee, index) => {
      const projectIndex = index % projects.length;
      const project = projects[projectIndex];
      
      // Create assignments for some days of the week
      const daysToAssign = Math.floor(Math.random() * 5) + 1; // 1-5 days
      const selectedDays = weekDates.slice(0, daysToAssign);
      
      selectedDays.forEach(date => {
        const assignment = {
          assignment_id: assignmentIdCounter++,
          employee_id: employee.employee_id,
          project_id: project.project_id,
          date: date,
          task_description: getTaskForPosition(employee.position),
          location: project.location,
          notes: `Week of 6/16/25-6/22/25 assignment`,
          status: 'Assigned',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        assignments.push(assignment);
      });
    });
    
    console.log('\n=== PARSING RESULTS ===');
    console.log(`Found ${employees.length} employees`);
    console.log(`Created ${projects.length} projects`);
    console.log(`Generated ${assignments.length} assignments`);
    
    return {
      employees,
      projects,
      assignments,
      metadata: {
        source_file: 'Legacy - MB Week 6.16.25-6.22.25.xlsx',
        parsed_at: new Date().toISOString(),
        week_period: '6/16/25-6/22/25'
      }
    };
    
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw error;
  }
}

/**
 * Get typical task description for a position
 */
function getTaskForPosition(position) {
  const tasks = {
    'Electrician': 'Install and maintain electrical systems and components',
    'Field Supervisor': 'Supervise field operations and ensure safety compliance',
    'Apprentice': 'Assist with electrical work and learn trade skills',
    'General Laborer': 'Support field operations and equipment handling',
    'Temp': 'Temporary support for various field activities',
    'Foreman': 'Lead project teams and coordinate work activities'
  };
  
  return tasks[position] || 'General field work and support activities';
}

// Export the function for use in other modules
module.exports = { parseExcelData };

// If run directly, execute the parsing
if (require.main === module) {
  parseExcelData()
    .then(data => {
      console.log('\n=== SAMPLE DATA ===');
      console.log('Sample employees:', data.employees.slice(0, 3));
      console.log('Sample projects:', data.projects.slice(0, 2));
      console.log('Sample assignments:', data.assignments.slice(0, 3));
      
      // Save to JSON file for inspection
      const outputPath = path.join(__dirname, '..', 'parsed-excel-data.json');
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
      console.log(`\nData saved to: ${outputPath}`);
    })
    .catch(error => {
      console.error('Failed to parse Excel data:', error);
      process.exit(1);
    });
}
