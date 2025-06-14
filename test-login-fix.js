#!/usr/bin/env node

/**
 * Test script to verify login authentication fix
 */

// Set environment variables for testing
process.env.USE_MEMORY_DB = 'true';
process.env.JWT_SECRET = 'test-secret-for-login-fix';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-login-fix';
process.env.NODE_ENV = 'development';
process.env.LOG_LEVEL = 'info';

console.log('🔧 Testing MetroPower Login Authentication Fix');
console.log('================================================');

async function testLoginFix() {
  try {
    console.log('1. Loading dependencies...');
    const User = require('./backend/src/models/User');
    const { connectDatabase } = require('./backend/src/config/database');
    
    console.log('2. Connecting to database...');
    await connectDatabase();
    console.log('✅ Database connected successfully');
    
    console.log('3. Testing authentication with admin credentials...');
    const authResult = await User.authenticate('admin@metropower.com', 'MetroPower2025!');
    
    if (authResult) {
      console.log('✅ Authentication successful!');
      console.log('   User ID:', authResult.user.user_id);
      console.log('   Username:', authResult.user.username);
      console.log('   Email:', authResult.user.email);
      console.log('   Role:', authResult.user.role);
      console.log('   Access Token Length:', authResult.accessToken.length);
      console.log('   Refresh Token Length:', authResult.refreshToken.length);
      
      console.log('4. Testing token generation...');
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(authResult.accessToken);
      console.log('   Token payload:', {
        user_id: decoded.user_id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        exp: new Date(decoded.exp * 1000).toISOString()
      });
      
      console.log('✅ All tests passed! Login should work correctly.');
      
    } else {
      console.log('❌ Authentication failed - this indicates an issue');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testLoginFix().then(() => {
  console.log('🎉 Login fix verification completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Login fix verification failed:', error.message);
  process.exit(1);
});
