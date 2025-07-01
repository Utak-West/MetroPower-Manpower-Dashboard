/**
 * Import Legacy Assignments to Neon Database
 * 
 * This script imports the parsed Excel assignment data into the Neon PostgreSQL database
 * with proper mapping to existing employees and projects.
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
 * Import assignments into the database
 */
async function importAssignments(assignments, excelEmployees, excelProjects, client) {
  console.log(`📥 Importing ${assignments.length} assignments...`);

  let imported = 0;
  let skipped = 0;
  let errors = [];

  // Get a default user for created_by (use admin user)
  const userResult = await client.query(
    "SELECT user_id FROM users WHERE role = 'Admin' OR email LIKE '%admin%' LIMIT 1"
  );

  const defaultUserId = userResult.rows.length > 0 ? userResult.rows[0].user_id : 1;
  console.log(`Using user ID ${defaultUserId} for created_by field`);

  // Get database employee and project mappings
  const employeesResult = await client.query('SELECT employee_id, name FROM employees');
  const projectsResult = await client.query('SELECT project_id, name FROM projects');

  const dbEmployeeMap = new Map();
  employeesResult.rows.forEach(emp => {
    dbEmployeeMap.set(emp.employee_id, emp.name);
  });

  const dbProjectMap = new Map();
  projectsResult.rows.forEach(proj => {
    dbProjectMap.set(proj.project_id, proj.name);
  });

  // Create mapping from Excel IDs to database IDs
  const excelToDbEmployeeMap = new Map();
  excelEmployees.forEach(excelEmp => {
    // Find matching employee in database by name or employee number
    const dbEmployee = employeesResult.rows.find(dbEmp =>
      dbEmp.name.toLowerCase() === excelEmp.name.toLowerCase() ||
      dbEmp.employee_id === excelEmp.employee_number
    );
    if (dbEmployee) {
      excelToDbEmployeeMap.set(excelEmp.employee_id, dbEmployee.employee_id);
    }
  });

  const excelToDbProjectMap = new Map();
  excelProjects.forEach(excelProj => {
    // Find matching project in database by name
    const dbProject = projectsResult.rows.find(dbProj =>
      dbProj.name.toLowerCase() === excelProj.name.toLowerCase()
    );
    if (dbProject) {
      excelToDbProjectMap.set(excelProj.project_id, dbProject.project_id);
    }
  });

  console.log(`Found ${dbEmployeeMap.size} employees and ${dbProjectMap.size} projects in database`);
  console.log(`Mapped ${excelToDbEmployeeMap.size} Excel employees to database employees`);
  console.log(`Mapped ${excelToDbProjectMap.size} Excel projects to database projects`);
  
  for (const assignment of assignments) {
    try {
      // Map Excel IDs to database IDs
      const dbEmployeeId = excelToDbEmployeeMap.get(assignment.employee_id);
      const dbProjectId = excelToDbProjectMap.get(assignment.project_id);

      // Validate that employee and project exist
      if (!dbEmployeeId) {
        errors.push(`Excel Employee ID ${assignment.employee_id} could not be mapped to database`);
        skipped++;
        continue;
      }

      if (!dbProjectId) {
        errors.push(`Excel Project ID ${assignment.project_id} could not be mapped to database`);
        skipped++;
        continue;
      }
      
      // Check for existing assignment (prevent duplicates)
      const existingResult = await client.query(
        'SELECT assignment_id FROM assignments WHERE employee_id = $1 AND assignment_date = $2',
        [dbEmployeeId, assignment.date]
      );

      if (existingResult.rows.length > 0) {
        skipped++;
        continue; // Skip duplicate
      }

      // Insert assignment
      await client.query(`
        INSERT INTO assignments (
          employee_id, project_id, assignment_date, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        dbEmployeeId,
        dbProjectId,
        assignment.date,
        assignment.notes || `Legacy assignment: ${assignment.task_description || 'Field work'}`,
        defaultUserId
      ]);
      
      imported++;
      
      // Log progress every 50 assignments
      if (imported % 50 === 0) {
        console.log(`  Progress: ${imported} assignments imported...`);
      }
      
    } catch (error) {
      errors.push(`Error importing assignment ${assignment.assignment_id}: ${error.message}`);
      skipped++;
    }
  }
  
  console.log(`✅ Assignments imported: ${imported}, skipped: ${skipped}`);
  
  if (errors.length > 0) {
    console.log(`⚠️  Errors encountered (showing first 10):`);
    errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
    if (errors.length > 10) {
      console.log(`  ... and ${errors.length - 10} more errors`);
    }
  }
  
  return { imported, skipped, errors };
}

/**
 * Main import function
 */
async function importLegacyAssignments() {
  console.log('🚀 Starting legacy assignments import to Neon database...\n');
  
  try {
    // Load parsed Excel data
    const dataPath = path.join(__dirname, '..', 'parsed-excel-data.json');
    
    if (!fs.existsSync(dataPath)) {
      throw new Error('Parsed Excel data not found. Please run parse-excel-data.js first.');
    }
    
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const legacyData = JSON.parse(rawData);
    
    console.log('📊 Legacy assignment data loaded:');
    console.log(`  - Assignments: ${legacyData.assignments.length}`);
    console.log('');
    
    // Connect to database
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Import assignments
      const assignmentResults = await importAssignments(
        legacyData.assignments,
        legacyData.employees,
        legacyData.projects,
        client
      );
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log('\n🎉 Legacy assignments import completed successfully!');
      console.log('📊 Summary:');
      console.log(`  - Assignments: ${assignmentResults.imported} imported, ${assignmentResults.skipped} skipped`);
      
      if (assignmentResults.errors.length > 0) {
        console.log(`  - Errors: ${assignmentResults.errors.length} total`);
      }
      
      // Verify final count
      const finalCount = await client.query('SELECT COUNT(*) as count FROM assignments');
      console.log(`  - Total assignments in database: ${finalCount.rows[0].count}`);
      
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Legacy assignments import failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the import if this script is executed directly
if (require.main === module) {
  importLegacyAssignments()
    .then(() => {
      console.log('\n✅ Assignment import process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Assignment import process failed:', error);
      process.exit(1);
    });
}

module.exports = { importLegacyAssignments };
