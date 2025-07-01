/**
 * Debug Database Initialization
 * 
 * This script tests the database initialization process to identify
 * why the system is falling back to demo mode.
 */

require('dotenv').config();

async function debugDatabaseInit() {
  console.log('🔍 Starting database initialization debug...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DEMO_MODE_ENABLED:', process.env.DEMO_MODE_ENABLED);
  console.log('USE_MEMORY_DB:', process.env.USE_MEMORY_DB);
  console.log('POSTGRES_URL exists:', !!process.env.POSTGRES_URL);
  console.log('POSTGRES_URL length:', process.env.POSTGRES_URL ? process.env.POSTGRES_URL.length : 0);
  console.log('');

  // Test basic database connection
  console.log('🔗 Testing basic database connection...');
  const { Pool } = require('pg');
  
  try {
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Basic connection successful');
    console.log('Current time:', result.rows[0].current_time);
    
    // Check tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables found:', tablesResult.rows.map(row => row.table_name));
    client.release();
    await pool.end();
    console.log('');
  } catch (error) {
    console.error('❌ Basic connection failed:', error.message);
    return;
  }

  // Test runtime database initialization
  console.log('🚀 Testing runtime database initialization...');
  try {
    const { initializeDatabase } = require('./backend/src/utils/runtime-db-init');
    const result = await initializeDatabase();
    
    console.log('✅ Runtime initialization result:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ Runtime initialization failed:', error.message);
    console.error('Stack trace:', error.stack);
    console.log('');
  }

  // Test database configuration
  console.log('⚙️  Testing database configuration...');
  try {
    const { connectDatabase, query } = require('./backend/src/config/database');
    
    await connectDatabase();
    console.log('✅ Database configuration connection successful');
    
    const testResult = await query('SELECT COUNT(*) as count FROM users');
    console.log('👥 Users count:', testResult.rows[0].count);
    
    const projectsResult = await query('SELECT COUNT(*) as count FROM projects');
    console.log('📁 Projects count:', projectsResult.rows[0].count);
    
    const employeesResult = await query('SELECT COUNT(*) as count FROM employees');
    console.log('👷 Employees count:', employeesResult.rows[0].count);
    console.log('');
  } catch (error) {
    console.error('❌ Database configuration test failed:', error.message);
    console.log('');
  }

  // Check global demo mode flag
  console.log('🎭 Checking global demo mode flag...');
  console.log('global.isDemoMode:', global.isDemoMode);
  console.log('');

  console.log('🏁 Debug complete!');
}

debugDatabaseInit().catch(console.error);
