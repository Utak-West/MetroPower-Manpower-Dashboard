/**
 * API endpoint to seed the database with initial data
 * This endpoint runs the seeder to populate projects and assignments
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database connection
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Helper function to execute queries
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Logger
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`)
};

/**
 * Seed projects data
 */
const seedProjects = async () => {
  logger.info('Seeding projects...');

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
    await query(`
      INSERT INTO projects (project_id, name, number, status, start_date, end_date, location, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (project_id) DO NOTHING
    `, [
      project.project_id, project.name, project.number, project.status,
      project.start_date, project.end_date, project.location, project.description
    ]);
  }

  logger.info('Projects seeded successfully');
};

/**
 * Seed sample assignments for current week
 */
const seedAssignments = async () => {
  logger.info('Seeding sample assignments...');

  // Get current week Monday
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysToMonday);

  // Get admin user ID for created_by
  const adminResult = await query('SELECT user_id FROM users WHERE username = $1', ['admin']);
  const adminId = adminResult.rows[0]?.user_id;

  if (!adminId) {
    logger.warn('Admin user not found, skipping assignment seeding');
    return;
  }

  // Sample assignments for the week (Monday to Friday)
  const assignments = [
    // Monday
    { employee_id: '004531', project_id: 'PROJ-A-12345', day_offset: 0 }, // Raul Santana
    { employee_id: '301001', project_id: 'PROJ-A-12345', day_offset: 0 }, // Mario Santos
    { employee_id: '301010', project_id: 'PROJ-A-12345', day_offset: 0 }, // Kevin Arredondo
    { employee_id: '300823', project_id: 'PROJ-A-12345', day_offset: 0 }, // Hunter Murchland
    { employee_id: '300959', project_id: 'PROJ-A-12345', day_offset: 0 }, // Pedro Orozco
    
    // Tuesday
    { employee_id: '004531', project_id: 'PROJ-B-67890', day_offset: 1 }, // Raul Santana
    { employee_id: '301001', project_id: 'PROJ-B-67890', day_offset: 1 }, // Mario Santos
    { employee_id: '301010', project_id: 'PROJ-B-67890', day_offset: 1 }, // Kevin Arredondo
    { employee_id: '300823', project_id: 'PROJ-B-67890', day_offset: 1 }, // Hunter Murchland
    { employee_id: '300959', project_id: 'PROJ-B-67890', day_offset: 1 }, // Pedro Orozco
    
    // Wednesday
    { employee_id: '004531', project_id: 'PROJ-C-11111', day_offset: 2 }, // Raul Santana
    { employee_id: '301001', project_id: 'PROJ-C-11111', day_offset: 2 }, // Mario Santos
    { employee_id: '301010', project_id: 'PROJ-C-11111', day_offset: 2 }, // Kevin Arredondo
    { employee_id: '300823', project_id: 'PROJ-C-11111', day_offset: 2 }, // Hunter Murchland
    { employee_id: '300959', project_id: 'PROJ-C-11111', day_offset: 2 }, // Pedro Orozco
    
    // Thursday
    { employee_id: '004531', project_id: 'PROJ-A-12345', day_offset: 3 }, // Raul Santana
    { employee_id: '301001', project_id: 'PROJ-A-12345', day_offset: 3 }, // Mario Santos
    { employee_id: '301010', project_id: 'PROJ-A-12345', day_offset: 3 }, // Kevin Arredondo
    { employee_id: '300823', project_id: 'PROJ-A-12345', day_offset: 3 }, // Hunter Murchland
    { employee_id: '300959', project_id: 'PROJ-A-12345', day_offset: 3 }, // Pedro Orozco
    
    // Friday
    { employee_id: '004531', project_id: 'PROJ-B-67890', day_offset: 4 }, // Raul Santana
    { employee_id: '301001', project_id: 'PROJ-B-67890', day_offset: 4 }, // Mario Santos
    { employee_id: '301010', project_id: 'PROJ-B-67890', day_offset: 4 }, // Kevin Arredondo
    { employee_id: '300823', project_id: 'PROJ-B-67890', day_offset: 4 }, // Hunter Murchland
    { employee_id: '300959', project_id: 'PROJ-B-67890', day_offset: 4 }, // Pedro Orozco
  ];

  for (const assignment of assignments) {
    const assignmentDate = new Date(monday);
    assignmentDate.setDate(monday.getDate() + assignment.day_offset);
    const dateStr = assignmentDate.toISOString().split('T')[0];

    await query(`
      INSERT INTO assignments (employee_id, project_id, assignment_date, created_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (employee_id, assignment_date) DO NOTHING
    `, [assignment.employee_id, assignment.project_id, dateStr, adminId]);
  }

  logger.info('Sample assignments seeded successfully');
};

/**
 * Main handler function
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    logger.info('Starting database seeding...');

    // Run seeders in order
    await seedProjects();
    await seedAssignments();

    logger.info('Database seeding completed successfully!');

    res.status(200).json({
      success: true,
      message: 'Database seeded successfully!',
      data: {
        projects: 'seeded',
        assignments: 'seeded'
      }
    });

  } catch (error) {
    logger.error('Database seeding failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database seeding failed',
      details: error.message
    });
  }
}
