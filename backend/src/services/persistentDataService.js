/**
 * Persistent Data Service
 *
 * Provides persistent database operations for the MetroPower Dashboard.
 * This service ensures all CRUD operations are saved to the database
 * and persist across application restarts and deployments.
 *
 * Copyright 2025 The HigherSelf Network
 */

const { query } = require('../config/database');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

class PersistentDataService {
  /**
   * Initialize persistent data in the database
   */
  static async initializePersistentData() {
    try {
      logger.info('Initializing persistent data...');
      
      // Run migrations first
      await this.runMigrations();
      
      // Initialize users if they don't exist
      await this.initializeUsers();
      
      // Initialize demo data if database is empty
      await this.initializeDemoDataIfEmpty();
      
      logger.info('Persistent data initialization completed');
    } catch (error) {
      logger.error('Failed to initialize persistent data:', error);
      throw error;
    }
  }

  /**
   * Run database migrations
   */
  static async runMigrations() {
    try {
      logger.info('Running database migrations...');
      
      // Check if migrations table exists
      const migrationsTableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'migrations'
        );
      `);
      
      if (!migrationsTableExists.rows[0].exists) {
        // Create migrations table
        await query(`
          CREATE TABLE migrations (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
        logger.info('Created migrations table');
      }
      
      // Run core table creation migration
      await this.runCoreMigration();
      
      // Run optimization migration
      await this.runOptimizationMigration();
      
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Run core table creation migration
   */
  static async runCoreMigration() {
    const migrationName = '001_create_tables.sql';
    
    // Check if migration already executed
    const migrationExists = await query(
      'SELECT id FROM migrations WHERE filename = $1',
      [migrationName]
    );
    
    if (migrationExists.rows.length > 0) {
      logger.info(`Migration ${migrationName} already executed`);
      return;
    }
    
    logger.info(`Running migration: ${migrationName}`);
    
    // Create core tables
    await query(`
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      -- Create ENUM types
      CREATE TYPE employee_status AS ENUM ('Active', 'PTO', 'Leave', 'Military', 'Terminated');
      CREATE TYPE project_status AS ENUM ('Active', 'Completed', 'On Hold', 'Planned');
      CREATE TYPE user_role AS ENUM ('Admin', 'Project Manager', 'Branch Manager', 'HR', 'View Only');
      
      -- 1. Positions/Trades Table
      CREATE TABLE IF NOT EXISTS positions (
          position_id SERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL UNIQUE,
          code VARCHAR(10) NOT NULL UNIQUE,
          color_code VARCHAR(7) NOT NULL DEFAULT '#000000',
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      -- 2. Users Table
      CREATE TABLE IF NOT EXISTS users (
          user_id SERIAL PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(100) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(50) NOT NULL,
          last_name VARCHAR(50) NOT NULL,
          role user_role NOT NULL DEFAULT 'View Only',
          is_active BOOLEAN DEFAULT true,
          last_login TIMESTAMP WITH TIME ZONE,
          password_reset_token VARCHAR(255),
          password_reset_expires TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      -- 3. Projects Table
      CREATE TABLE IF NOT EXISTS projects (
          project_id VARCHAR(20) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          number VARCHAR(20) NOT NULL UNIQUE,
          status project_status NOT NULL DEFAULT 'Active',
          start_date DATE,
          end_date DATE,
          location VARCHAR(100),
          manager_id INTEGER REFERENCES users(user_id),
          description TEXT,
          budget DECIMAL(12,2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      -- 4. Employees Table
      CREATE TABLE IF NOT EXISTS employees (
          employee_id VARCHAR(10) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          position_id INTEGER NOT NULL REFERENCES positions(position_id),
          status employee_status NOT NULL DEFAULT 'Active',
          employee_number VARCHAR(20) UNIQUE,
          hire_date DATE,
          phone VARCHAR(20),
          email VARCHAR(100),
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      -- 5. Assignments Table
      CREATE TABLE IF NOT EXISTS assignments (
          assignment_id SERIAL PRIMARY KEY,
          employee_id VARCHAR(10) NOT NULL REFERENCES employees(employee_id),
          project_id VARCHAR(20) NOT NULL REFERENCES projects(project_id),
          assignment_date DATE NOT NULL,
          created_by INTEGER NOT NULL REFERENCES users(user_id),
          updated_by INTEGER REFERENCES users(user_id),
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          
          -- Prevent double-booking: one employee per day
          UNIQUE(employee_id, assignment_date)
      );
    `);
    
    // Mark migration as executed
    await query(
      'INSERT INTO migrations (filename) VALUES ($1)',
      [migrationName]
    );
    
    logger.info(`Migration ${migrationName} completed`);
  }

  /**
   * Run optimization migration
   */
  static async runOptimizationMigration() {
    const migrationName = '002_optimize_indexes.sql';
    
    // Check if migration already executed
    const migrationExists = await query(
      'SELECT id FROM migrations WHERE filename = $1',
      [migrationName]
    );
    
    if (migrationExists.rows.length > 0) {
      logger.info(`Migration ${migrationName} already executed`);
      return;
    }
    
    logger.info(`Running migration: ${migrationName}`);
    
    // Create optimized indexes
    await query(`
      -- Create Indexes for Performance
      CREATE INDEX IF NOT EXISTS idx_employees_position ON employees(position_id);
      CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
      CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);
      
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
      CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(manager_id);
      CREATE INDEX IF NOT EXISTS idx_projects_number ON projects(number);
      
      CREATE INDEX IF NOT EXISTS idx_assignments_employee ON assignments(employee_id);
      CREATE INDEX IF NOT EXISTS idx_assignments_project ON assignments(project_id);
      CREATE INDEX IF NOT EXISTS idx_assignments_date ON assignments(assignment_date);
      CREATE INDEX IF NOT EXISTS idx_assignments_employee_date ON assignments(employee_id, assignment_date);
      
      -- Additional optimized indexes
      CREATE INDEX IF NOT EXISTS idx_assignments_date_project ON assignments(assignment_date, project_id);
      CREATE INDEX IF NOT EXISTS idx_assignments_date_employee ON assignments(assignment_date, employee_id);
      CREATE INDEX IF NOT EXISTS idx_assignments_project_date ON assignments(project_id, assignment_date);
    `);
    
    // Mark migration as executed
    await query(
      'INSERT INTO migrations (filename) VALUES ($1)',
      [migrationName]
    );
    
    logger.info(`Migration ${migrationName} completed`);
  }

  /**
   * Initialize users if they don't exist
   */
  static async initializeUsers() {
    try {
      // Check if users already exist
      const userCount = await query('SELECT COUNT(*) FROM users');
      
      if (parseInt(userCount.rows[0].count) > 0) {
        logger.info('Users already exist, skipping user initialization');
        return;
      }
      
      logger.info('Creating initial users...');
      
      // Create password hashes
      const adminPasswordHash = await bcrypt.hash('MetroPower2025!', 12);
      const managerPasswordHash = await bcrypt.hash('password123', 12);
      
      // Insert admin user
      await query(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, ['admin', 'admin@metropower.com', adminPasswordHash, 'System', 'Administrator', 'Admin', true]);
      
      // Insert Antione Harrell
      await query(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, ['antione.harrell', 'antione.harrell@metropower.com', managerPasswordHash, 'Antione', 'Harrell', 'Project Manager', true]);
      
      logger.info('Initial users created successfully');
    } catch (error) {
      logger.error('Failed to initialize users:', error);
      throw error;
    }
  }

  /**
   * Initialize demo data if database is empty
   */
  static async initializeDemoDataIfEmpty() {
    try {
      // Check if we have any employees
      const employeeCount = await query('SELECT COUNT(*) FROM employees');
      
      if (parseInt(employeeCount.rows[0].count) > 0) {
        logger.info('Data already exists, skipping demo data initialization');
        return;
      }
      
      logger.info('Initializing demo data...');
      
      // Load and insert demo data from the existing demo service
      const demoService = require('./demoService');
      await demoService.initializeDemoData();
      
      // Get the demo data
      const demoEmployees = await demoService.getEmployees();
      const demoProjects = await demoService.getProjects();
      
      // Insert positions first
      const positions = [
        { name: 'Electrician', code: 'ELEC', color_code: '#3498db' },
        { name: 'Field Supervisor', code: 'FSUP', color_code: '#e74c3c' },
        { name: 'Apprentice', code: 'APPR', color_code: '#f39c12' },
        { name: 'General Laborer', code: 'LABR', color_code: '#95a5a6' },
        { name: 'Temp', code: 'TEMP', color_code: '#9b59b6' },
        { name: 'Service Tech', code: 'STECH', color_code: '#1abc9c' },
        { name: 'Foreman', code: 'FORE', color_code: '#e67e22' }
      ];
      
      for (const position of positions) {
        await query(`
          INSERT INTO positions (name, code, color_code)
          VALUES ($1, $2, $3)
          ON CONFLICT (name) DO NOTHING
        `, [position.name, position.code, position.color_code]);
      }
      
      // Insert projects
      for (const project of demoProjects) {
        await query(`
          INSERT INTO projects (project_id, name, number, status, start_date, end_date, location, description)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (project_id) DO NOTHING
        `, [
          project.project_id,
          project.name,
          project.number || project.project_id,
          project.status || 'Active',
          project.start_date,
          project.end_date,
          project.location,
          project.description
        ]);
      }
      
      // Insert employees
      for (const employee of demoEmployees) {
        // Get position_id
        const positionResult = await query(
          'SELECT position_id FROM positions WHERE name = $1',
          [employee.position || employee.trade || 'General Laborer']
        );
        
        const positionId = positionResult.rows.length > 0 ? positionResult.rows[0].position_id : 1;
        
        await query(`
          INSERT INTO employees (employee_id, name, position_id, status, employee_number, hire_date, phone, email, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (employee_id) DO NOTHING
        `, [
          employee.employee_id,
          employee.name,
          positionId,
          employee.status || 'Active',
          employee.employee_number,
          employee.hire_date,
          employee.phone,
          employee.email,
          employee.notes || ''
        ]);
      }
      
      logger.info('Demo data initialization completed');
    } catch (error) {
      logger.error('Failed to initialize demo data:', error);
      throw error;
    }
  }
}

module.exports = PersistentDataService;
