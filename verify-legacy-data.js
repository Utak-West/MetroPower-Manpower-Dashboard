/**
 * Verify Legacy Data in Database
 * 
 * This script verifies that all legacy Excel data has been properly
 * imported into the Neon database.
 */

require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');

async function verifyLegacyData() {
  console.log('🔍 Verifying legacy data in Neon database...\n');
  
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    
    // Get database counts
    const employeeCount = await client.query('SELECT COUNT(*) as count FROM employees');
    const projectCount = await client.query('SELECT COUNT(*) as count FROM projects');
    const assignmentCount = await client.query('SELECT COUNT(*) as count FROM assignments');
    
    console.log('📊 Database Summary:');
    console.log(`  - Employees: ${employeeCount.rows[0].count}`);
    console.log(`  - Projects: ${projectCount.rows[0].count}`);
    console.log(`  - Assignments: ${assignmentCount.rows[0].count}`);
    console.log('');
    
    // Get Excel data for comparison
    const excelData = JSON.parse(fs.readFileSync('parsed-excel-data.json', 'utf8'));
    
    console.log('📋 Excel Data Summary:');
    console.log(`  - Employees: ${excelData.employees.length}`);
    console.log(`  - Projects: ${excelData.projects.length}`);
    console.log(`  - Assignments: ${excelData.assignments.length}`);
    console.log('');
    
    // Sample employees from database
    const sampleEmployees = await client.query(`
      SELECT 
        e.name, 
        e.employee_number, 
        p.name as position, 
        e.status,
        e.phone,
        e.email
      FROM employees e
      LEFT JOIN positions p ON e.position_id = p.position_id
      ORDER BY e.name
      LIMIT 15
    `);
    
    console.log('👥 Sample Employees in Database:');
    sampleEmployees.rows.forEach(emp => {
      console.log(`  - ${emp.name} (${emp.employee_number}) - ${emp.position} - ${emp.status}`);
    });
    console.log('');
    
    // Check if key employees from Excel are in database
    const keyEmployees = [
      'Tim Sheppard',
      'Kevin Diaz', 
      'Stephen Hendrix',
      'Omar Ibrahim',
      'Cameron Seely'
    ];
    
    console.log('🔍 Checking key employees from Excel:');
    for (const name of keyEmployees) {
      const result = await client.query('SELECT name, employee_number, status FROM employees WHERE name ILIKE $1', [`%${name}%`]);
      if (result.rows.length > 0) {
        console.log(`  ✅ ${name} - Found (${result.rows[0].employee_number})`);
      } else {
        console.log(`  ❌ ${name} - Not found`);
      }
    }
    console.log('');
    
    // Check positions
    const positions = await client.query('SELECT name, code FROM positions ORDER BY name');
    console.log('🏷️  Available Positions:');
    positions.rows.forEach(pos => {
      console.log(`  - ${pos.name} (${pos.code})`);
    });
    console.log('');
    
    // Check recent assignments
    const recentAssignments = await client.query(`
      SELECT 
        a.assignment_date,
        e.name as employee_name,
        p.name as project_name,
        a.status
      FROM assignments a
      JOIN employees e ON a.employee_id = e.employee_id
      JOIN projects p ON a.project_id = p.project_id
      ORDER BY a.assignment_date DESC
      LIMIT 10
    `);
    
    console.log('📅 Recent Assignments:');
    recentAssignments.rows.forEach(assign => {
      console.log(`  - ${assign.assignment_date}: ${assign.employee_name} → ${assign.project_name} (${assign.status})`);
    });
    
    client.release();
    await pool.end();
    
    console.log('\n✅ Legacy data verification completed!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    throw error;
  }
}

verifyLegacyData().catch(console.error);
