/**
 * Direct Neon Database Connection Test
 * 
 * This script connects directly to the Neon PostgreSQL database
 * to verify tables exist and check data.
 */

const { Pool } = require('pg');

async function testNeonDatabase() {
  // Use the exact connection string from .env
  const connectionString = 'postgres://neondb_owner:npg_FIzeB8CoU3tM@ep-small-wildflower-a4s9we42-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Testing Neon database connection...');
    
    // Test connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Neon database connected successfully!');
    console.log(`  Current time: ${result.rows[0].current_time}`);
    console.log(`  PostgreSQL version: ${result.rows[0].version.split(' ')[0]}`);
    client.release();
    
    // Check what tables exist
    console.log('\n📋 Checking tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    if (tablesResult.rows.length > 0) {
      // Check data in key tables
      console.log('\n📊 Checking data counts...');
      
      const tables = ['users', 'projects', 'employees', 'assignments', 'positions'];
      
      for (const tableName of tables) {
        try {
          const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`  ${tableName}: ${countResult.rows[0].count} records`);
        } catch (error) {
          console.log(`  ${tableName}: Table not found or error - ${error.message}`);
        }
      }
      
      // Show sample data from users table
      try {
        console.log('\n👤 Sample users:');
        const usersResult = await pool.query('SELECT username, email, role FROM users LIMIT 5');
        usersResult.rows.forEach(user => {
          console.log(`  - ${user.username} (${user.email}) - ${user.role}`);
        });
      } catch (error) {
        console.log('  Error fetching users:', error.message);
      }
      
    } else {
      console.log('\n❌ No tables found in database!');
      console.log('Database needs to be initialized.');
    }
    
  } catch (error) {
    console.error('❌ Error testing Neon database:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testNeonDatabase();
