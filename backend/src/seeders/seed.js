/**
 * Database Seeder
 *
 * Populates the MetroPower Dashboard database with initial data
 * including positions, users, employees, projects, and sample assignments.
 */

const bcrypt = require('bcryptjs')
const { query, connectDatabase } = require('../config/database')
const logger = require('../utils/logger')

/**
 * Seed positions/trades data
 */
const seedPositions = async () => {
  logger.info('Seeding positions...')

  const positions = [
    { name: 'Electrician', code: 'EL', color_code: '#28A745', description: 'Licensed electrician' },
    { name: 'Field Supervisor', code: 'FS', color_code: '#3B5998', description: 'Field operations supervisor' },
    { name: 'Apprentice', code: 'AP', color_code: '#F7B731', description: 'Electrical apprentice' },
    { name: 'General Laborer', code: 'GL', color_code: '#6F42C1', description: 'General construction laborer' },
    { name: 'Temp', code: 'TM', color_code: '#E52822', description: 'Temporary worker' }
  ]

  for (const position of positions) {
    await query(`
      INSERT INTO positions (name, code, color_code, description)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (name) DO NOTHING
    `, [position.name, position.code, position.color_code, position.description])
  }

  logger.info('Positions seeded successfully')
}

/**
 * Seed users data
 */
const seedUsers = async () => {
  logger.info('Seeding users...')

  const saltRounds = 12
  const defaultPassword = await bcrypt.hash('MetroPower2025!', saltRounds)

  const users = [
    {
      username: 'admin',
      email: 'admin@metropower.com',
      password_hash: defaultPassword,
      first_name: 'System',
      last_name: 'Administrator',
      role: 'Admin'
    },
    {
      username: 'antoine.harrell',
      email: 'antoine.harrell@metropower.com',
      password_hash: defaultPassword,
      first_name: 'Antione',
      last_name: 'Harrell',
      role: 'Project Manager'
    },
    {
      username: 'branch.manager',
      email: 'manager@metropower.com',
      password_hash: defaultPassword,
      first_name: 'Branch',
      last_name: 'Manager',
      role: 'Branch Manager'
    },
    {
      username: 'hr.user',
      email: 'hr@metropower.com',
      password_hash: defaultPassword,
      first_name: 'HR',
      last_name: 'User',
      role: 'HR'
    }
  ]

  for (const user of users) {
    await query(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
    `, [user.username, user.email, user.password_hash, user.first_name, user.last_name, user.role])
  }

  logger.info('Users seeded successfully')
}

/**
 * Seed projects data
 */
const seedProjects = async () => {
  logger.info('Seeding projects...')

  // Get Antione Harrell's user ID
  const antoineResult = await query('SELECT user_id FROM users WHERE username = $1', ['antoine.harrell'])
  const antioneId = antioneResult.rows[0]?.user_id

  const projects = [
    {
      project_id: 'PROJ-A-12345',
      name: 'Project A',
      number: '12345',
      status: 'Active',
      start_date: '2025-01-01',
      end_date: '2025-06-30',
      location: 'Tucker Industrial Park',
      manager_id: antioneId,
      description: 'Electrical installation for new warehouse facility'
    },
    {
      project_id: 'PROJ-B-23456',
      name: 'Project B',
      number: '23456',
      status: 'Active',
      start_date: '2025-02-01',
      end_date: '2025-08-31',
      location: 'Downtown Office Complex',
      manager_id: antioneId,
      description: 'Office building electrical upgrade'
    },
    {
      project_id: 'PROJ-C-34567',
      name: 'Project C',
      number: '34567',
      status: 'Active',
      start_date: '2025-03-01',
      end_date: '2025-09-30',
      location: 'Residential Development',
      manager_id: antioneId,
      description: 'New residential community electrical infrastructure'
    },
    {
      project_id: 'PROJ-D-45678',
      name: 'Project D',
      number: '45678',
      status: 'Active',
      start_date: '2025-04-01',
      end_date: '2025-10-31',
      location: 'Manufacturing Plant',
      manager_id: antioneId,
      description: 'Industrial electrical system installation'
    }
  ]

  for (const project of projects) {
    await query(`
      INSERT INTO projects (project_id, name, number, status, start_date, end_date, location, manager_id, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (project_id) DO NOTHING
    `, [
      project.project_id, project.name, project.number, project.status,
      project.start_date, project.end_date, project.location, project.manager_id, project.description
    ])
  }

  logger.info('Projects seeded successfully')
}

/**
 * Seed employees data
 */
const seedEmployees = async () => {
  logger.info('Seeding employees...')

  // Get position IDs
  const positionsResult = await query('SELECT position_id, name FROM positions')
  const positions = {}
  positionsResult.rows.forEach(row => {
    positions[row.name] = row.position_id
  })

  const employees = [
    // Field Supervisors
    { employee_id: '004531', name: 'Raul Santana', position: 'Field Supervisor', employee_number: '004531', status: 'Active' },
    { employee_id: '004478', name: 'Matt Smith', position: 'Field Supervisor', employee_number: '004478', status: 'Active' },

    // Electricians
    { employee_id: '301257', name: 'Zack Page', position: 'Electrician', employee_number: '301257', status: 'Active' },
    { employee_id: '301258', name: 'John Davis', position: 'Electrician', employee_number: '301258', status: 'Active' },
    { employee_id: '301259', name: 'Mike Wilson', position: 'Electrician', employee_number: '301259', status: 'Active' },
    { employee_id: '301260', name: 'Chris Johnson', position: 'Electrician', employee_number: '301260', status: 'Active' },
    { employee_id: '301261', name: 'David Brown', position: 'Electrician', employee_number: '301261', status: 'Active' },

    // Apprentices
    { employee_id: '300956', name: 'Julian Rodriguez', position: 'Apprentice', employee_number: '300956', status: 'Active' },
    { employee_id: '301001', name: 'Mario Santos', position: 'Apprentice', employee_number: '301001', status: 'Active' },
    { employee_id: '301010', name: 'Kevin Arredondo', position: 'Apprentice', employee_number: '301010', status: 'Active' },
    { employee_id: '300823', name: 'Hunter Murchland', position: 'Apprentice', employee_number: '300823', status: 'Active' },
    { employee_id: '300959', name: 'Pedro Orozco', position: 'Apprentice', employee_number: '300959', status: 'Active' },
    { employee_id: '301011', name: 'Carlos Martinez', position: 'Apprentice', employee_number: '301011', status: 'Active' },
    { employee_id: '301012', name: 'Luis Garcia', position: 'Apprentice', employee_number: '301012', status: 'Active' },
    { employee_id: '301013', name: 'Jose Hernandez', position: 'Apprentice', employee_number: '301013', status: 'Active' },
    { employee_id: '301014', name: 'Miguel Lopez', position: 'Apprentice', employee_number: '301014', status: 'Active' },
    { employee_id: '301015', name: 'Antonio Gonzalez', position: 'Apprentice', employee_number: '301015', status: 'Active' },

    // General Laborers
    { employee_id: '302001', name: 'Robert Taylor', position: 'General Laborer', employee_number: '302001', status: 'Active' },
    { employee_id: '302002', name: 'James Anderson', position: 'General Laborer', employee_number: '302002', status: 'Active' },
    { employee_id: '302003', name: 'William Thomas', position: 'General Laborer', employee_number: '302003', status: 'Active' },
    { employee_id: '302004', name: 'Richard Jackson', position: 'General Laborer', employee_number: '302004', status: 'Active' },

    // Temps
    { employee_id: 'TEMP001', name: 'Alex Thompson', position: 'Temp', employee_number: 'TEMP001', status: 'Active' },
    { employee_id: 'TEMP002', name: 'Sam Williams', position: 'Temp', employee_number: 'TEMP002', status: 'Active' },
    { employee_id: 'TEMP003', name: 'Jordan Miller', position: 'Temp', employee_number: 'TEMP003', status: 'Active' }
  ]

  for (const employee of employees) {
    const positionId = positions[employee.position]
    if (positionId) {
      await query(`
        INSERT INTO employees (employee_id, name, position_id, status, employee_number, hire_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (employee_id) DO NOTHING
      `, [
        employee.employee_id,
        employee.name,
        positionId,
        employee.status,
        employee.employee_number,
        '2024-01-01' // Default hire date
      ])
    }
  }

  logger.info('Employees seeded successfully')
}

/**
 * Seed sample assignments for current week
 */
const seedAssignments = async () => {
  logger.info('Seeding sample assignments...')

  // Get current week Monday
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + daysToMonday)

  // Get admin user ID for created_by
  const adminResult = await query('SELECT user_id FROM users WHERE username = $1', ['admin'])
  const adminId = adminResult.rows[0]?.user_id

  if (!adminId) {
    logger.warn('Admin user not found, skipping assignment seeding')
    return
  }

  // Sample assignments for the week (Monday to Friday)
  const assignments = [
    // Monday
    { employee_id: '004531', project_id: 'PROJ-A-12345', day_offset: 0 }, // Raul Santana
    { employee_id: '301001', project_id: 'PROJ-A-12345', day_offset: 0 }, // Mario Santos
    { employee_id: '301010', project_id: 'PROJ-A-12345', day_offset: 0 }, // Kevin Arredondo
    { employee_id: '300823', project_id: 'PROJ-A-12345', day_offset: 0 }, // Hunter Murchland
    { employee_id: '300959', project_id: 'PROJ-A-12345', day_offset: 0 }, // Pedro Orozco

    // Tuesday - same assignments
    { employee_id: '004531', project_id: 'PROJ-A-12345', day_offset: 1 },
    { employee_id: '301001', project_id: 'PROJ-A-12345', day_offset: 1 },
    { employee_id: '301010', project_id: 'PROJ-A-12345', day_offset: 1 },
    { employee_id: '300823', project_id: 'PROJ-A-12345', day_offset: 1 },
    { employee_id: '300959', project_id: 'PROJ-A-12345', day_offset: 1 },

    // Wednesday - same assignments
    { employee_id: '004531', project_id: 'PROJ-A-12345', day_offset: 2 },
    { employee_id: '301001', project_id: 'PROJ-A-12345', day_offset: 2 },
    { employee_id: '301010', project_id: 'PROJ-A-12345', day_offset: 2 },
    { employee_id: '300823', project_id: 'PROJ-A-12345', day_offset: 2 },
    { employee_id: '300959', project_id: 'PROJ-A-12345', day_offset: 2 },

    // Thursday - same assignments
    { employee_id: '004531', project_id: 'PROJ-A-12345', day_offset: 3 },
    { employee_id: '301001', project_id: 'PROJ-A-12345', day_offset: 3 },
    { employee_id: '301010', project_id: 'PROJ-A-12345', day_offset: 3 },
    { employee_id: '300823', project_id: 'PROJ-A-12345', day_offset: 3 },
    { employee_id: '300959', project_id: 'PROJ-A-12345', day_offset: 3 },

    // Friday - same assignments
    { employee_id: '004531', project_id: 'PROJ-A-12345', day_offset: 4 },
    { employee_id: '301001', project_id: 'PROJ-A-12345', day_offset: 4 },
    { employee_id: '301010', project_id: 'PROJ-A-12345', day_offset: 4 },
    { employee_id: '300823', project_id: 'PROJ-A-12345', day_offset: 4 },
    { employee_id: '300959', project_id: 'PROJ-A-12345', day_offset: 4 }
  ]

  for (const assignment of assignments) {
    const assignmentDate = new Date(monday)
    assignmentDate.setDate(monday.getDate() + assignment.day_offset)
    const dateStr = assignmentDate.toISOString().split('T')[0]

    await query(`
      INSERT INTO assignments (employee_id, project_id, assignment_date, created_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (employee_id, assignment_date) DO NOTHING
    `, [assignment.employee_id, assignment.project_id, dateStr, adminId])
  }

  logger.info('Sample assignments seeded successfully')
}

/**
 * Main seeding function
 */
const seedDatabase = async () => {
  try {
    logger.info('Starting database seeding...')

    // Connect to database
    await connectDatabase()

    // Run seeders in order
    await seedPositions()
    await seedUsers()
    await seedProjects()
    await seedEmployees()
    await seedAssignments()

    logger.info('Database seeding completed successfully!')
    logger.info('Default login credentials:')
    logger.info('  Admin: admin@metropower.com / MetroPower2025!')
    logger.info('  Antoine Harrell: antoine.harrell@metropower.com / MetroPower2025!')
  } catch (error) {
    logger.error('Database seeding failed:', error)
    process.exit(1)
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedDatabase()
}

module.exports = {
  seedDatabase,
  seedPositions,
  seedUsers,
  seedProjects,
  seedEmployees,
  seedAssignments
}
