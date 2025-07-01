/**
 * Import Legacy Data to Neon Database
 * 
 * This script imports the parsed Excel data into the Neon PostgreSQL database
 * using the same data management approach as the rest of the system.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Import employees into the database
 */
async function importEmployees(employees, client) {
  console.log(`📥 Importing ${employees.length} employees...`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const employee of employees) {
    try {
      // Map position to position_id
      let positionId = 1; // Default to first position
      
      // Get position ID from database
      const positionResult = await client.query(
        'SELECT position_id FROM positions WHERE name ILIKE $1 OR code ILIKE $1',
        [employee.position]
      );
      
      if (positionResult.rows.length > 0) {
        positionId = positionResult.rows[0].position_id;
      } else {
        console.log(`⚠️  Position not found: ${employee.position}, using default`);
      }
      
      // Generate employee ID if not provided
      const employeeId = employee.employee_number || `EMP${Date.now()}_${imported}`;
      
      // Insert employee
      await client.query(`
        INSERT INTO employees (
          employee_id, name, position_id, status, employee_number,
          hire_date, phone, email, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (employee_id) DO UPDATE SET
          name = EXCLUDED.name,
          position_id = EXCLUDED.position_id,
          status = EXCLUDED.status,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          updated_at = CURRENT_TIMESTAMP
      `, [
        employeeId,
        employee.name,
        positionId,
        employee.status || 'Active',
        employee.employee_number,
        employee.hire_date || '2024-01-01',
        employee.phone || '',
        employee.email || '',
        `Imported from legacy Excel file - ${employee.department || 'Field Operations'}`
      ]);
      
      imported++;
      
    } catch (error) {
      console.error(`❌ Error importing employee ${employee.name}:`, error.message);
      skipped++;
    }
  }
  
  console.log(`✅ Employees imported: ${imported}, skipped: ${skipped}`);
  return { imported, skipped };
}

/**
 * Import projects into the database
 */
async function importProjects(projects, client) {
  console.log(`📥 Importing ${projects.length} projects...`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const project of projects) {
    try {
      // Get a manager ID (use first admin/manager user)
      const managerResult = await client.query(
        "SELECT user_id FROM users WHERE role IN ('Admin', 'Project Manager') LIMIT 1"
      );
      
      const managerId = managerResult.rows.length > 0 ? managerResult.rows[0].user_id : 1;
      
      // Insert project
      await client.query(`
        INSERT INTO projects (
          project_id, name, number, status, start_date, end_date,
          location, manager_id, description, budget
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (project_id) DO UPDATE SET
          name = EXCLUDED.name,
          number = EXCLUDED.number,
          status = EXCLUDED.status,
          location = EXCLUDED.location,
          description = EXCLUDED.description,
          updated_at = CURRENT_TIMESTAMP
      `, [
        project.project_id || `PRJ-${Date.now()}_${imported}`,
        project.name,
        project.number || `PRJ-${Date.now()}`,
        project.status || 'Active',
        project.start_date || '2025-06-16',
        project.end_date || null,
        project.location || 'Tucker, GA',
        managerId,
        project.description || 'Imported from legacy Excel file',
        project.budget || null
      ]);
      
      imported++;
      
    } catch (error) {
      console.error(`❌ Error importing project ${project.name}:`, error.message);
      skipped++;
    }
  }
  
  console.log(`✅ Projects imported: ${imported}, skipped: ${skipped}`);
  return { imported, skipped };
}

/**
 * Import assignments into the database
 */
async function importAssignments(assignments, client) {
  console.log(`📥 Importing ${assignments.length} assignments...`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const assignment of assignments) {
    try {
      // Insert assignment
      await client.query(`
        INSERT INTO assignments (
          assignment_id, employee_id, project_id, assignment_date,
          task_description, location, notes, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (assignment_id) DO UPDATE SET
          task_description = EXCLUDED.task_description,
          location = EXCLUDED.location,
          notes = EXCLUDED.notes,
          status = EXCLUDED.status,
          updated_at = CURRENT_TIMESTAMP
      `, [
        assignment.assignment_id || `ASG-${Date.now()}_${imported}`,
        assignment.employee_id,
        assignment.project_id,
        assignment.date,
        assignment.task_description || 'Legacy assignment',
        assignment.location || 'Field Location',
        assignment.notes || 'Imported from legacy Excel file',
        assignment.status || 'Completed'
      ]);
      
      imported++;
      
    } catch (error) {
      console.error(`❌ Error importing assignment ${assignment.assignment_id}:`, error.message);
      skipped++;
    }
  }
  
  console.log(`✅ Assignments imported: ${imported}, skipped: ${skipped}`);
  return { imported, skipped };
}

/**
 * Main import function
 */
async function importLegacyData() {
  console.log('🚀 Starting legacy data import to Neon database...\n');
  
  try {
    // Load parsed Excel data
    const dataPath = path.join(__dirname, '..', 'parsed-excel-data.json');
    
    if (!fs.existsSync(dataPath)) {
      throw new Error('Parsed Excel data not found. Please run parse-excel-data.js first.');
    }
    
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const legacyData = JSON.parse(rawData);
    
    console.log('📊 Legacy data loaded:');
    console.log(`  - Employees: ${legacyData.employees.length}`);
    console.log(`  - Projects: ${legacyData.projects.length}`);
    console.log(`  - Assignments: ${legacyData.assignments.length}`);
    console.log('');
    
    // Connect to database
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Import data in order (employees first, then projects, then assignments)
      const employeeResults = await importEmployees(legacyData.employees, client);
      console.log('');
      
      const projectResults = await importProjects(legacyData.projects, client);
      console.log('');
      
      const assignmentResults = await importAssignments(legacyData.assignments, client);
      console.log('');
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log('🎉 Legacy data import completed successfully!');
      console.log('📊 Summary:');
      console.log(`  - Employees: ${employeeResults.imported} imported, ${employeeResults.skipped} skipped`);
      console.log(`  - Projects: ${projectResults.imported} imported, ${projectResults.skipped} skipped`);
      console.log(`  - Assignments: ${assignmentResults.imported} imported, ${assignmentResults.skipped} skipped`);
      
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Legacy data import failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the import if this script is executed directly
if (require.main === module) {
  importLegacyData()
    .then(() => {
      console.log('\n✅ Import process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Import process failed:', error);
      process.exit(1);
    });
}

module.exports = { importLegacyData };
