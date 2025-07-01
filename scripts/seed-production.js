/**
 * Production Database Seeding Script
 * This script populates the production Neon database with sample projects and assignments
 */

const { Pool } = require('pg');

// Database connection using the production Neon connection string
const pool = new Pool({
  connectionString: 'postgres://neondb_owner:npg_FIzeB8CoU3tM@ep-small-wildflower-a4s9we42-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function seedProjects() {
  console.log('🏗️ Seeding projects...');
  
  const projects = [
    {
      project_id: 'PROJ-A-12345',
      name: 'Tucker Mall Renovation',
      number: 'TM-2024-001',
      status: 'Active',
      start_date: '2024-06-01',
      end_date: '2024-08-15',
      location: '4166 Lavista Rd, Tucker, GA 30084',
      description: 'Complete electrical renovation of Tucker Mall food court and common areas'
    },
    {
      project_id: 'PROJ-B-67890',
      name: 'Office Complex Wiring',
      number: 'OC-2024-002',
      status: 'Active',
      start_date: '2024-06-10',
      end_date: '2024-07-30',
      location: '1234 Business Blvd, Tucker, GA 30084',
      description: 'New construction electrical installation for 3-story office building'
    },
    {
      project_id: 'PROJ-C-11111',
      name: 'Residential Development',
      number: 'RD-2024-003',
      status: 'Active',
      start_date: '2024-05-15',
      end_date: '2024-09-01',
      location: '5678 Residential Way, Tucker, GA 30084',
      description: 'Electrical installation for 12-unit townhome development'
    }
  ];

  for (const project of projects) {
    try {
      await pool.query(`
        INSERT INTO projects (project_id, name, number, status, start_date, end_date, location, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (project_id) DO NOTHING
      `, [
        project.project_id, project.name, project.number, project.status,
        project.start_date, project.end_date, project.location, project.description
      ]);
      console.log(`✅ Project ${project.name} inserted`);
    } catch (error) {
      console.error(`❌ Error inserting project ${project.name}:`, error.message);
    }
  }
}

async function seedAssignments() {
  console.log('📋 Seeding assignments...');

  // Get admin user ID
  const adminResult = await pool.query('SELECT user_id FROM users WHERE username = $1', ['admin']);
  const adminId = adminResult.rows[0]?.user_id;

  if (!adminId) {
    console.error('❌ Admin user not found, cannot create assignments');
    return;
  }

  console.log(`👤 Using admin user ID: ${adminId}`);

  // First, get actual employee IDs from the database
  const employeesResult = await pool.query('SELECT employee_id FROM employees WHERE status = $1 LIMIT 10', ['Active']);
  const employeeIds = employeesResult.rows.map(row => row.employee_id);

  console.log(`👥 Found ${employeeIds.length} active employees:`, employeeIds);

  if (employeeIds.length === 0) {
    console.error('❌ No active employees found, cannot create assignments');
    return;
  }

  // Sample assignments for current week (June 30 - July 4, 2025)
  const assignments = [];

  // Monday (2025-06-30) - Tucker Mall Renovation
  employeeIds.slice(0, 5).forEach(empId => {
    assignments.push({ employee_id: empId, project_id: 'PROJ-A-12345', date: '2025-06-30' });
  });

  // Tuesday (2025-07-01) - Office Complex Wiring
  employeeIds.slice(0, 5).forEach(empId => {
    assignments.push({ employee_id: empId, project_id: 'PROJ-B-67890', date: '2025-07-01' });
  });

  // Wednesday (2025-07-02) - Residential Development
  employeeIds.slice(0, 5).forEach(empId => {
    assignments.push({ employee_id: empId, project_id: 'PROJ-C-11111', date: '2025-07-02' });
  });

  // Thursday (2025-07-03) - Tucker Mall Renovation
  employeeIds.slice(5, 10).forEach(empId => {
    assignments.push({ employee_id: empId, project_id: 'PROJ-A-12345', date: '2025-07-03' });
  });

  // Friday (2025-07-04) - Office Complex Wiring
  employeeIds.slice(5, 10).forEach(empId => {
    assignments.push({ employee_id: empId, project_id: 'PROJ-B-67890', date: '2025-07-04' });
  });

  let successCount = 0;
  let errorCount = 0;

  for (const assignment of assignments) {
    try {
      await pool.query(`
        INSERT INTO assignments (employee_id, project_id, assignment_date, created_by)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (employee_id, assignment_date) DO NOTHING
      `, [assignment.employee_id, assignment.project_id, assignment.date, adminId]);
      successCount++;
    } catch (error) {
      console.error(`❌ Error inserting assignment for ${assignment.employee_id} on ${assignment.date}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`✅ Assignments inserted: ${successCount}, Errors: ${errorCount}`);
}

async function verifyData() {
  console.log('🔍 Verifying seeded data...');
  
  try {
    const projectsResult = await pool.query('SELECT COUNT(*) as count FROM projects');
    const assignmentsResult = await pool.query('SELECT COUNT(*) as count FROM assignments');
    
    console.log(`📊 Projects in database: ${projectsResult.rows[0].count}`);
    console.log(`📊 Assignments in database: ${assignmentsResult.rows[0].count}`);
    
    // Show sample data
    const sampleProjects = await pool.query('SELECT project_id, name, status FROM projects LIMIT 5');
    console.log('📋 Sample projects:');
    sampleProjects.rows.forEach(project => {
      console.log(`  - ${project.project_id}: ${project.name} (${project.status})`);
    });
    
    const sampleAssignments = await pool.query(`
      SELECT a.assignment_date, e.name as employee_name, p.name as project_name 
      FROM assignments a 
      JOIN employees e ON a.employee_id = e.employee_id 
      JOIN projects p ON a.project_id = p.project_id 
      ORDER BY a.assignment_date DESC 
      LIMIT 5
    `);
    console.log('📋 Sample assignments:');
    sampleAssignments.rows.forEach(assignment => {
      console.log(`  - ${assignment.assignment_date}: ${assignment.employee_name} → ${assignment.project_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Starting production database seeding...');
    console.log('🔗 Connecting to Neon database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    await seedProjects();
    await seedAssignments();
    await verifyData();
    
    console.log('🎉 Production database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the seeding
main();
