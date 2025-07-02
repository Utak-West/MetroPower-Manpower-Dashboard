/**
 * Test Database Initialization Middleware
 * 
 * This script tests the database initialization middleware
 * to verify it sets global.isDemoMode correctly.
 */

require('dotenv').config();

async function testMiddleware() {
  console.log('🔍 Testing database initialization middleware...\n');
  
  try {
    // Import the middleware
    const { ensureDatabaseInitialized } = require('./backend/src/middleware/database-init');
    
    console.log('📋 Initial state:');
    console.log('global.isDemoMode:', global.isDemoMode);
    console.log('');

    // Create mock request and response objects
    const mockReq = {
      path: '/api/projects',
      originalUrl: '/api/projects'
    };
    
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`Response ${code}:`, data);
          return mockRes;
        },
        send: (html) => {
          console.log(`Response ${code}: HTML response`);
          return mockRes;
        }
      })
    };
    
    let nextCalled = false;
    const mockNext = () => {
      nextCalled = true;
      console.log('✅ next() called - middleware passed');
    };

    // Test the middleware
    console.log('🔄 Running ensureDatabaseInitialized middleware...');
    await ensureDatabaseInitialized(mockReq, mockRes, mockNext);
    
    console.log('');
    console.log('📋 Final state:');
    console.log('global.isDemoMode:', global.isDemoMode);
    console.log('next() called:', nextCalled);
    console.log('');

    // Test route behavior based on demo mode
    if (global.isDemoMode === false) {
      console.log('✅ Database mode detected - routes should use database');
      
      // Test a simple database query
      const { query } = require('./backend/src/config/database');
      const result = await query('SELECT COUNT(*) as count FROM projects');
      console.log('📁 Projects in database:', result.rows[0].count);
      
    } else if (global.isDemoMode === true) {
      console.log('🎭 Demo mode detected - routes should use demo service');
      
      // Test demo service
      const demoService = require('./backend/src/services/demoService');
      const projects = await demoService.getProjects();
      console.log('📁 Projects in demo service:', projects.length);
      
    } else {
      console.log('⚠️  global.isDemoMode is undefined - this indicates an issue');
    }
    
    console.log('\n✅ Middleware test completed!');
    
  } catch (error) {
    console.error('❌ Middleware test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testMiddleware().catch(console.error);
