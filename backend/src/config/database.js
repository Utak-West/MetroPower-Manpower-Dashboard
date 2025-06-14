/**
 * Database Configuration and Connection Management
 *
 * Handles database connections with fallback to in-memory storage for development.
 * Supports both PostgreSQL (production) and in-memory storage (development/demo).
 */

const config = require('./app');
const logger = require('../utils/logger');

// Use in-memory storage for development/demo if PostgreSQL is not available
const useMemoryDB = process.env.USE_MEMORY_DB === 'true' || process.env.NODE_ENV === 'development';

let db = null;

let isConnected = false;

// In-memory database for development/demo
let memoryDB = {
  users: [],
  positions: [],
  projects: [],
  assignments: []
};

// PostgreSQL setup function (only loaded when needed)
let createPool = null;

if (useMemoryDB) {
  logger.info('Using in-memory database for development/demo');
} else {
  // PostgreSQL setup for production
  const { Pool } = require('pg');

  /**
   * Create database connection pool
   * @returns {Pool} PostgreSQL connection pool
   */
  createPool = function() {
    const dbConfig = {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,

      // Connection pool settings
      min: config.database.pool.min,
      max: config.database.pool.max,
      acquireTimeoutMillis: config.database.pool.acquire,
      idleTimeoutMillis: config.database.pool.idle,

      // Additional settings for reliability
      connectionTimeoutMillis: 10000,
      query_timeout: 30000,
      statement_timeout: 30000,

      // Handle connection errors
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    };

    // Log connection attempt (without password)
    const logConfig = { ...dbConfig };
    delete logConfig.password;
    logger.info('Creating PostgreSQL connection pool', logConfig);

    return new Pool(dbConfig);
  };
}

/**
 * Connect to the database
 * @returns {Promise<void>}
 */
async function connectDatabase() {
  if (isConnected) {
    return;
  }

  try {
    if (useMemoryDB) {
      // Initialize in-memory database with demo data
      await initializeMemoryDB();
      isConnected = true;
      logger.info('In-memory database connection established');
    } else {
      // PostgreSQL connection
      if (!db) {
        db = createPool();
      }

      // Test the connection
      const client = await db.connect();
      await client.query('SELECT NOW()');
      client.release();

      isConnected = true;
      logger.info('PostgreSQL database connection established successfully');

      // Handle pool errors
      db.on('error', (err) => {
        logger.error('Database pool error:', err);
        isConnected = false;
      });

      db.on('connect', () => {
        logger.debug('New database connection established');
      });

      db.on('remove', () => {
        logger.debug('Database connection removed from pool');
      });
    }

  } catch (error) {
    logger.error('Failed to connect to database:', error);
    isConnected = false;
    throw error;
  }
}

/**
 * Initialize in-memory database with demo data
 */
async function initializeMemoryDB() {
  if (!useMemoryDB) return;

  const bcrypt = require('bcryptjs');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('MetroPower2025!', 12);

  memoryDB.users = [
    {
      user_id: 1,
      username: 'admin',
      email: 'admin@metropower.com',
      password_hash: hashedPassword,
      first_name: 'System',
      last_name: 'Administrator',
      role: 'Admin',
      is_active: true,
      last_login: null,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      user_id: 2,
      username: 'antione.harrell',
      email: 'antione.harrell@metropower.com',
      password_hash: await bcrypt.hash('password123', 12),
      first_name: 'Antione',
      last_name: 'Harrell',
      role: 'Project Manager',
      is_active: true,
      last_login: null,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  // Sample employees data
  memoryDB.employees = [
    {
      employee_id: 'EMP001',
      name: 'John Smith',
      position_id: 1,
      status: 'Active',
      employee_number: '12345',
      hire_date: '2024-01-15',
      phone: '555-0101',
      email: 'john.smith@metropower.com',
      notes: 'Experienced electrician',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      employee_id: 'EMP002',
      name: 'Mike Johnson',
      position_id: 2,
      status: 'Active',
      employee_number: '12346',
      hire_date: '2023-08-20',
      phone: '555-0102',
      email: 'mike.johnson@metropower.com',
      notes: 'Field supervisor with 10 years experience',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      employee_id: 'EMP003',
      name: 'Sarah Davis',
      position_id: 3,
      status: 'Active',
      employee_number: '12347',
      hire_date: '2024-03-01',
      phone: '555-0103',
      email: 'sarah.davis@metropower.com',
      notes: 'Second year apprentice',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      employee_id: 'EMP004',
      name: 'Robert Wilson',
      position_id: 1,
      status: 'PTO',
      employee_number: '12348',
      hire_date: '2023-11-10',
      phone: '555-0104',
      email: 'robert.wilson@metropower.com',
      notes: 'On vacation until next week',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      employee_id: 'EMP005',
      name: 'Lisa Brown',
      position_id: 4,
      status: 'Active',
      employee_number: '12349',
      hire_date: '2024-02-14',
      phone: '555-0105',
      email: 'lisa.brown@metropower.com',
      notes: 'General laborer, reliable worker',
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  memoryDB.positions = [
    { position_id: 1, name: 'Electrician', code: 'ELEC', color_code: '#007bff', created_at: new Date() },
    { position_id: 2, name: 'Field Supervisor', code: 'FSUP', color_code: '#28a745', created_at: new Date() },
    { position_id: 3, name: 'Apprentice', code: 'APPR', color_code: '#ffc107', created_at: new Date() },
    { position_id: 4, name: 'General Laborer', code: 'GLAB', color_code: '#6c757d', created_at: new Date() },
    { position_id: 5, name: 'Temp', code: 'TEMP', color_code: '#dc3545', created_at: new Date() }
  ];

  memoryDB.projects = [
    {
      project_id: 'PROJ-001',
      name: 'Downtown Office Building',
      number: 'TB-2025-001',
      status: 'Active',
      start_date: new Date('2025-01-01'),
      end_date: new Date('2025-06-30'),
      location: '123 Main St, Atlanta, GA',
      manager_id: 2,
      description: 'Electrical installation for new office building',
      budget: 250000.00,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      project_id: 'PROJ-002',
      name: 'Warehouse Renovation',
      number: 'TB-2025-002',
      status: 'Active',
      start_date: new Date('2025-02-01'),
      end_date: new Date('2025-08-15'),
      location: '456 Industrial Blvd, Atlanta, GA',
      manager_id: 2,
      description: 'Complete electrical system upgrade for warehouse facility',
      budget: 180000.00,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      project_id: 'PROJ-003',
      name: 'Retail Store Chain',
      number: 'TB-2025-003',
      status: 'Active',
      start_date: new Date('2025-03-01'),
      end_date: new Date('2025-09-30'),
      location: 'Multiple locations, Atlanta Metro',
      manager_id: 2,
      description: 'Electrical work for 5 new retail store locations',
      budget: 320000.00,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  // Sample assignments data (current week)
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1); // Get Monday of current week

  memoryDB.assignments = [
    // Monday assignments
    {
      assignment_id: 1,
      employee_id: 'EMP001',
      project_id: 'PROJ-001',
      assignment_date: new Date(monday),
      created_by: 2,
      notes: 'Working on main electrical panel installation',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      assignment_id: 2,
      employee_id: 'EMP002',
      project_id: 'PROJ-001',
      assignment_date: new Date(monday),
      created_by: 2,
      notes: 'Supervising electrical team',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      assignment_id: 3,
      employee_id: 'EMP003',
      project_id: 'PROJ-002',
      assignment_date: new Date(monday),
      created_by: 2,
      notes: 'Assisting with conduit installation',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      assignment_id: 4,
      employee_id: 'EMP005',
      project_id: 'PROJ-002',
      assignment_date: new Date(monday),
      created_by: 2,
      notes: 'Material handling and site cleanup',
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  logger.info('In-memory database initialized with demo data');
}

/**
 * Execute a database query
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function query(text, params = []) {
  const start = Date.now();

  try {
    // Ensure we have a connection
    if (!isConnected) {
      await connectDatabase();
    }

    let result;

    if (useMemoryDB) {
      // Handle in-memory database queries
      result = await executeMemoryQuery(text, params);
    } else {
      // PostgreSQL query
      result = await db.query(text, params);
    }

    const duration = Date.now() - start;

    // Log query for debugging (only in debug mode)
    if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('Database query executed', {
        query: text.replace(/\s+/g, ' ').trim(),
        params: params.length > 0 ? '[PARAMS]' : 'none',
        duration: `${duration}ms`,
        rows: result.rows.length
      });
    }

    return result;

  } catch (error) {
    const duration = Date.now() - start;

    logger.error('Database query failed', {
      query: text.replace(/\s+/g, ' ').trim(),
      params: params.length > 0 ? '[PARAMS]' : 'none',
      duration: `${duration}ms`,
      error: error.message
    });

    throw error;
  }
}

/**
 * Execute query against in-memory database
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function executeMemoryQuery(text, params = []) {
  const queryLower = text.toLowerCase().trim();

  // Handle SELECT NOW() or version queries
  if (queryLower.includes('select now()') || queryLower.includes('current_time')) {
    return {
      rows: [{ current_time: new Date(), version: 'In-Memory Database v1.0' }],
      rowCount: 1
    };
  }

  // Handle user authentication queries
  if (queryLower.includes('select') && queryLower.includes('users') && queryLower.includes('email')) {
    const email = params[0];
    const user = memoryDB.users.find(u => u.email === email || u.username === email);
    logger.debug('User authentication query', { email, userFound: !!user });
    return {
      rows: user ? [user] : [],
      rowCount: user ? 1 : 0
    };
  }

  // Handle user count queries
  if (queryLower.includes('count') && queryLower.includes('users')) {
    return {
      rows: [{ count: memoryDB.users.length.toString() }],
      rowCount: 1
    };
  }

  // Handle table existence queries
  if (queryLower.includes('information_schema.tables') && queryLower.includes('users')) {
    return {
      rows: [{ table_name: 'users' }],
      rowCount: 1
    };
  }

  // Handle user selection by ID
  if (queryLower.includes('select') && queryLower.includes('users') && queryLower.includes('user_id')) {
    const userId = params[0];
    const user = memoryDB.users.find(u => u.user_id === parseInt(userId));
    return {
      rows: user ? [user] : [],
      rowCount: user ? 1 : 0
    };
  }

  // Handle user last_login update
  if (queryLower.includes('update') && queryLower.includes('users') && queryLower.includes('last_login')) {
    const userId = params[0];
    const userIndex = memoryDB.users.findIndex(u => u.user_id === parseInt(userId));
    if (userIndex !== -1) {
      memoryDB.users[userIndex].last_login = new Date();
      memoryDB.users[userIndex].updated_at = new Date();
      logger.debug('Updated user last_login', { userId });
    }
    return {
      rows: [],
      rowCount: userIndex !== -1 ? 1 : 0
    };
  }

  // Handle position queries
  if (queryLower.includes('select') && queryLower.includes('positions')) {
    return {
      rows: memoryDB.positions,
      rowCount: memoryDB.positions.length
    };
  }

  // Handle project queries
  if (queryLower.includes('select') && queryLower.includes('projects')) {
    return {
      rows: memoryDB.projects,
      rowCount: memoryDB.projects.length
    };
  }

  // Handle employee queries
  if (queryLower.includes('select') && queryLower.includes('employees')) {
    return {
      rows: memoryDB.employees,
      rowCount: memoryDB.employees.length
    };
  }

  // Handle assignment queries
  if (queryLower.includes('select') && queryLower.includes('assignments')) {
    return {
      rows: memoryDB.assignments,
      rowCount: memoryDB.assignments.length
    };
  }

  // Handle employee creation
  if (queryLower.includes('insert') && queryLower.includes('employees')) {
    const newEmployee = {
      employee_id: params[0],
      name: params[1],
      position_id: params[2],
      status: params[3] || 'Active',
      employee_number: params[4],
      hire_date: params[5],
      phone: params[6],
      email: params[7],
      notes: params[8],
      created_at: new Date(),
      updated_at: new Date()
    };
    memoryDB.employees.push(newEmployee);
    return {
      rows: [newEmployee],
      rowCount: 1
    };
  }

  // Handle project creation
  if (queryLower.includes('insert') && queryLower.includes('projects')) {
    const newProject = {
      project_id: params[0],
      name: params[1],
      number: params[2],
      status: params[3] || 'Active',
      start_date: params[4],
      end_date: params[5],
      location: params[6],
      manager_id: params[7],
      description: params[8],
      budget: params[9],
      created_at: new Date(),
      updated_at: new Date()
    };
    memoryDB.projects.push(newProject);
    return {
      rows: [newProject],
      rowCount: 1
    };
  }

  // Handle assignment creation
  if (queryLower.includes('insert') && queryLower.includes('assignments')) {
    const newAssignment = {
      assignment_id: memoryDB.assignments.length + 1,
      employee_id: params[0],
      project_id: params[1],
      assignment_date: params[2],
      created_by: params[3],
      notes: params[4],
      created_at: new Date(),
      updated_at: new Date()
    };
    memoryDB.assignments.push(newAssignment);
    return {
      rows: [newAssignment],
      rowCount: 1
    };
  }

  // Default response for unhandled queries
  logger.warn('Unhandled memory database query:', text);
  return {
    rows: [],
    rowCount: 0
  };
}

/**
 * Execute a transaction
 * @param {Function} callback - Function to execute within transaction
 * @returns {Promise<any>} Transaction result
 */
async function transaction(callback) {
  if (!isConnected) {
    await connectDatabase();
  }

  if (useMemoryDB) {
    // For memory DB, just execute the callback with the query function
    return await callback(query);
  } else {
    // PostgreSQL transaction
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Create a query function bound to this client
      const transactionQuery = (text, params) => client.query(text, params);

      const result = await callback(transactionQuery);

      await client.query('COMMIT');
      return result;

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction failed:', error);
      throw error;

    } finally {
      client.release();
    }
  }
}

/**
 * Get connection pool status
 * @returns {Object} Pool status information
 */
function getPoolStatus() {
  if (useMemoryDB) {
    return {
      connected: isConnected,
      type: 'memory',
      users: memoryDB.users.length,
      positions: memoryDB.positions.length,
      projects: memoryDB.projects.length
    };
  }

  if (!db) {
    return { connected: false, pool: null };
  }

  return {
    connected: isConnected,
    type: 'postgresql',
    totalCount: db.totalCount,
    idleCount: db.idleCount,
    waitingCount: db.waitingCount
  };
}

/**
 * Close database connection pool
 * @returns {Promise<void>}
 */
async function closeDatabase() {
  if (useMemoryDB) {
    logger.info('Closing in-memory database');
    isConnected = false;
  } else if (db) {
    logger.info('Closing database connection pool');
    await db.end();
    db = null;
    isConnected = false;
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});

module.exports = {
  connectDatabase,
  query,
  transaction,
  getPoolStatus,
  closeDatabase,
  get pool() { return db; },
  get isConnected() { return isConnected; }
};
