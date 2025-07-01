/**
 * Vercel Database Setup Script
 * 
 * This script manually sets up the database tables and initial data
 * for the MetroPower Dashboard when deployed to Vercel.
 */

require('dotenv').config();
const { Pool } = require('pg');

async function setupDatabase() {
  console.log('🚀 Setting up MetroPower Dashboard database...');
  
  // Check if we have the Vercel Postgres URL or Neon URL
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

  if (!connectionString) {
    console.error('❌ No database connection string found');
    console.log('💡 Looking for: POSTGRES_URL, DATABASE_URL, or NEON_DATABASE_URL');
    console.log('💡 Available environment variables:');
    Object.keys(process.env).filter(key => key.includes('POSTGRES') || key.includes('DATABASE') || key.includes('NEON')).forEach(key => {
      console.log(`  ${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`);
    });
    process.exit(1);
  }

  console.log('🔗 Using connection string:', connectionString.substring(0, 50) + '...');
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    // Test connection
    console.log('🔍 Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Database connected successfully!');
    console.log(`  Current time: ${result.rows[0].current_time}`);
    console.log(`  PostgreSQL version: ${result.rows[0].version.split(' ')[0]}`);
    client.release();
    
    // Create tables
    console.log('📋 Creating database tables...');
    
    // Enable extensions and create types
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      DO $$ BEGIN
        CREATE TYPE employee_status AS ENUM ('Active', 'PTO', 'Leave', 'Military', 'Terminated');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE project_status AS ENUM ('Active', 'Completed', 'On Hold', 'Planned');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('Admin', 'Project Manager', 'Branch Manager', 'HR', 'View Only');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    // Create migrations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create positions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS positions (
        position_id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        code VARCHAR(10) NOT NULL UNIQUE,
        color_code VARCHAR(7) NOT NULL DEFAULT '#000000',
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create users table
    await pool.query(`
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
    `);
    
    // Create employees table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        employee_id VARCHAR(10) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        position_id INTEGER REFERENCES positions(position_id),
        status employee_status NOT NULL DEFAULT 'Active',
        employee_number VARCHAR(20),
        hire_date DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create projects table
    await pool.query(`
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
    `);
    
    // Create assignments table
    await pool.query(`
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
        UNIQUE(employee_id, assignment_date)
      );
    `);
    
    console.log('✅ Database tables created successfully!');
    
    // Insert initial data
    console.log('👤 Creating initial users...');
    
    // Check if users already exist
    const userCheck = await pool.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(userCheck.rows[0].count);
    
    if (userCount === 0) {
      // Generate password hash for MetroPower2025! (both users use same password)
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('MetroPower2025!', 12);

      // Insert admin user (password: MetroPower2025!)
      await pool.query(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'admin',
        'admin@metropower.com',
        passwordHash,
        'System',
        'Administrator',
        'Admin',
        true
      ]);

      // Insert Antione Harrell (password: MetroPower2025!)
      await pool.query(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'antione.harrell',
        'antione.harrell@metropower.com',
        passwordHash,
        'Antione',
        'Harrell',
        'Project Manager',
        true
      ]);
      
      console.log('✅ Initial users created successfully!');
    } else {
      console.log(`ℹ️  Found ${userCount} existing users, skipping user creation`);
    }
    
    // Insert default positions
    console.log('🔧 Creating default positions...');
    
    const positions = [
      { name: 'Electrician', code: 'ELEC', color: '#FF6B35' },
      { name: 'Lineman', code: 'LINE', color: '#004E89' },
      { name: 'Foreman', code: 'FORE', color: '#1A936F' },
      { name: 'Apprentice', code: 'APPR', color: '#88D498' },
      { name: 'Supervisor', code: 'SUPV', color: '#C73E1D' }
    ];
    
    for (const position of positions) {
      await pool.query(`
        INSERT INTO positions (name, code, color_code)
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO NOTHING
      `, [position.name, position.code, position.color]);
    }
    
    console.log('✅ Default positions created successfully!');
    
    // Mark migration as completed
    await pool.query(`
      INSERT INTO migrations (filename)
      VALUES ('001_create_tables.sql')
      ON CONFLICT (filename) DO NOTHING
    `);
    
    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('  ✅ Database connection verified');
    console.log('  ✅ Tables created');
    console.log('  ✅ Initial users created');
    console.log('  ✅ Default positions created');
    console.log('');
    console.log('🔐 Login credentials:');
    console.log('  Manager: antione.harrell@metropower.com / MetroPower2025!');
    console.log('  Admin: admin@metropower.com / MetroPower2025!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the setup
setupDatabase();
