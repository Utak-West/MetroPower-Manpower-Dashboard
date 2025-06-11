#!/usr/bin/env node

/**
 * Database Connection Test Script
 * 
 * This script tests the database connection and provides detailed
 * information about the connection status and any issues.
 */

require('dotenv').config();
const { Pool } = require('pg');

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...\n');

  // Display configuration (without sensitive data)
  console.log('Configuration:');
  console.log(`  Host: ${process.env.DB_HOST || 'NOT SET'}`);
  console.log(`  Port: ${process.env.DB_PORT || 'NOT SET'}`);
  console.log(`  Database: ${process.env.DB_NAME || 'NOT SET'}`);
  console.log(`  User: ${process.env.DB_USER || 'NOT SET'}`);
  console.log(`  Password: ${process.env.DB_PASSWORD ? '***SET***' : 'NOT SET'}`);
  console.log(`  SSL: ${process.env.DB_SSL || 'NOT SET'}\n`);

  // Check required environment variables
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    process.exit(1);
  }

  // Create connection pool
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  });

  try {
    // Test connection
    console.log('🔌 Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Connection successful!\n');

    // Test basic query
    console.log('🔍 Testing basic query...');
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Query successful!');
    console.log(`  Current time: ${result.rows[0].current_time}`);
    console.log(`  PostgreSQL version: ${result.rows[0].version.split(' ')[0]}\n`);

    // Check if tables exist
    console.log('📋 Checking tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No tables found. Database needs to be initialized.');
    } else {
      console.log(`✅ Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }

    // Check users table specifically
    if (tablesResult.rows.some(row => row.table_name === 'users')) {
      console.log('\n👥 Checking users...');
      const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
      const userCount = parseInt(usersResult.rows[0].count);
      
      if (userCount === 0) {
        console.log('⚠️  No users found. Database needs to be seeded.');
      } else {
        console.log(`✅ Found ${userCount} users`);
        
        // Show sample user
        const sampleResult = await client.query('SELECT username, email, role FROM users LIMIT 1');
        if (sampleResult.rows.length > 0) {
          const user = sampleResult.rows[0];
          console.log(`  Sample user: ${user.username} (${user.email}) - ${user.role}`);
        }
      }
    }

    client.release();
    console.log('\n🎉 Database connection test completed successfully!');

  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error(`  Error: ${error.message}`);
    
    if (error.code) {
      console.error(`  Code: ${error.code}`);
    }
    
    // Provide specific guidance based on error
    if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 Suggestions:');
      console.error('  - Check if DB_HOST is correct');
      console.error('  - Verify network connectivity');
      console.error('  - Ensure database server is running');
    } else if (error.message.includes('authentication')) {
      console.error('\n💡 Suggestions:');
      console.error('  - Check DB_USER and DB_PASSWORD');
      console.error('  - Verify user has access to the database');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.error('\n💡 Suggestions:');
      console.error('  - Check if DB_NAME is correct');
      console.error('  - Create the database if it doesn\'t exist');
    } else if (error.message.includes('SSL')) {
      console.error('\n💡 Suggestions:');
      console.error('  - Try setting DB_SSL=true if using cloud database');
      console.error('  - Try setting DB_SSL=false for local development');
    }

    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
if (require.main === module) {
  testDatabaseConnection();
}

module.exports = { testDatabaseConnection };
