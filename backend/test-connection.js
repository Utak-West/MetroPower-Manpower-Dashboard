/**
 * Simple Database Connection Test
 * Tests the database connection using our new database module
 */

require('dotenv').config({ path: '../.env' });

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('Environment variables:');
    console.log(`  DB_HOST: ${process.env.DB_HOST || 'NOT SET'}`);
    console.log(`  DB_PORT: ${process.env.DB_PORT || 'NOT SET'}`);
    console.log(`  DB_NAME: ${process.env.DB_NAME || 'NOT SET'}`);
    console.log(`  DB_USER: ${process.env.DB_USER || 'NOT SET'}`);
    console.log(`  DB_PASSWORD: ${process.env.DB_PASSWORD ? '***SET***' : 'NOT SET'}`);
    console.log(`  DB_SSL: ${process.env.DB_SSL || 'NOT SET'}`);
    console.log('');
    
    // Import our database module
    const { connectDatabase, query } = require('./src/config/database');
    
    // Test connection
    await connectDatabase();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Query successful!');
    console.log(`  Current time: ${result.rows[0].current_time}`);
    console.log(`  PostgreSQL version: ${result.rows[0].version.split(' ')[0]}`);
    
    // Test if users table exists
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('✅ Users table exists');
      
      // Check if there are any users
      const usersResult = await query('SELECT COUNT(*) as count FROM users');
      const userCount = parseInt(usersResult.rows[0].count);
      console.log(`📊 Found ${userCount} users in database`);
      
      if (userCount > 0) {
        // Test authentication with default user
        const User = require('./src/models/User');
        const authResult = await User.authenticate('admin@metropower.com', 'MetroPower2025!');
        
        if (authResult) {
          console.log('✅ Authentication test successful!');
          console.log(`  User: ${authResult.user.username} (${authResult.user.email})`);
          console.log(`  Role: ${authResult.user.role}`);
        } else {
          console.log('❌ Authentication test failed - invalid credentials');
        }
      } else {
        console.log('⚠️  No users found - database needs to be seeded');
      }
    } else {
      console.log('❌ Users table does not exist - database needs to be migrated');
    }
    
    console.log('\n🎉 All tests completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Suggestion: Make sure PostgreSQL is running');
      console.error('   You can start it with: brew services start postgresql');
      console.error('   Or with Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=metropower123 postgres');
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 Suggestion: Check DB_HOST in .env file');
    } else if (error.message.includes('authentication')) {
      console.error('💡 Suggestion: Check DB_USER and DB_PASSWORD in .env file');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.error('💡 Suggestion: Create the database or check DB_NAME in .env file');
      console.error('   You can create it with: createdb metropower_dashboard');
    }
    
    process.exit(1);
  }
}

// Run the test
testConnection();
