/**
 * Test Server Initialization
 * 
 * This script tests the server startup process to verify
 * that database initialization works correctly.
 */

require('dotenv').config();

async function testServerInit() {
  console.log('🔍 Testing server initialization...\n');
  
  try {
    // Import the server module
    const { initializeApp } = require('./backend/server');
    
    console.log('📋 Environment check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DEMO_MODE_ENABLED:', process.env.DEMO_MODE_ENABLED);
    console.log('USE_MEMORY_DB:', process.env.USE_MEMORY_DB);
    console.log('POSTGRES_URL exists:', !!process.env.POSTGRES_URL);
    console.log('');

    // Test the initialization
    console.log('🚀 Running initializeApp...');
    const result = await initializeApp();
    
    console.log('✅ Initialization result:', result);
    console.log('🎭 global.isDemoMode:', global.isDemoMode);
    console.log('');

    // Test a simple database query to verify connection
    if (!global.isDemoMode) {
      console.log('🔍 Testing database query...');
      const { query } = require('./backend/src/config/database');
      
      const usersResult = await query('SELECT COUNT(*) as count FROM users');
      console.log('👥 Users count:', usersResult.rows[0].count);
      
      const projectsResult = await query('SELECT COUNT(*) as count FROM projects');
      console.log('📁 Projects count:', projectsResult.rows[0].count);
      
      const employeesResult = await query('SELECT COUNT(*) as count FROM employees');
      console.log('👷 Employees count:', employeesResult.rows[0].count);
    } else {
      console.log('🎭 Running in demo mode - skipping database queries');
    }
    
    console.log('\n✅ Server initialization test completed successfully!');
    
  } catch (error) {
    console.error('❌ Server initialization test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testServerInit().catch(console.error);
