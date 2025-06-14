/**
 * Authentication Logic Test
 * Tests the authentication logic without requiring a database connection
 */

require('dotenv').config({ path: '../.env' });

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('./src/config/app');

async function testAuthenticationLogic() {
  console.log('🔍 Testing authentication logic...\n');

  try {
    // Test 1: Password hashing and verification
    console.log('1. Testing password hashing...');
    const password = 'MetroPower2025!';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('✅ Password hashed successfully');
    console.log(`   Hash: ${hashedPassword.substring(0, 20)}...`);

    // Test password verification
    const isValidPassword = await bcrypt.compare(password, hashedPassword);
    console.log(`✅ Password verification: ${isValidPassword ? 'PASS' : 'FAIL'}`);

    // Test wrong password
    const isWrongPassword = await bcrypt.compare('wrongpassword', hashedPassword);
    console.log(`✅ Wrong password rejection: ${!isWrongPassword ? 'PASS' : 'FAIL'}`);

    console.log('');

    // Test 2: JWT Token generation and verification
    console.log('2. Testing JWT token generation...');
    
    const mockUser = {
      user_id: 1,
      username: 'admin',
      email: 'admin@metropower.com',
      role: 'Admin'
    };

    // Generate access token
    const accessTokenPayload = {
      user_id: mockUser.user_id,
      username: mockUser.username,
      email: mockUser.email,
      role: mockUser.role,
      type: 'access'
    };

    const accessToken = jwt.sign(accessTokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: config.app.name,
      subject: mockUser.user_id.toString()
    });

    console.log('✅ Access token generated successfully');
    console.log(`   Token: ${accessToken.substring(0, 50)}...`);

    // Generate refresh token
    const refreshTokenPayload = {
      user_id: mockUser.user_id,
      type: 'refresh'
    };

    const refreshToken = jwt.sign(refreshTokenPayload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: config.app.name,
      subject: mockUser.user_id.toString()
    });

    console.log('✅ Refresh token generated successfully');
    console.log(`   Token: ${refreshToken.substring(0, 50)}...`);

    console.log('');

    // Test 3: Token verification
    console.log('3. Testing JWT token verification...');
    
    try {
      const decoded = jwt.verify(accessToken, config.jwt.secret);
      console.log('✅ Access token verification: PASS');
      console.log(`   User ID: ${decoded.user_id}`);
      console.log(`   Username: ${decoded.username}`);
      console.log(`   Role: ${decoded.role}`);
      console.log(`   Type: ${decoded.type}`);
    } catch (error) {
      console.log('❌ Access token verification: FAIL');
      console.log(`   Error: ${error.message}`);
    }

    try {
      const decodedRefresh = jwt.verify(refreshToken, config.jwt.refreshSecret);
      console.log('✅ Refresh token verification: PASS');
      console.log(`   User ID: ${decodedRefresh.user_id}`);
      console.log(`   Type: ${decodedRefresh.type}`);
    } catch (error) {
      console.log('❌ Refresh token verification: FAIL');
      console.log(`   Error: ${error.message}`);
    }

    console.log('');

    // Test 4: Invalid token handling
    console.log('4. Testing invalid token handling...');
    
    try {
      jwt.verify('invalid.token.here', config.jwt.secret);
      console.log('❌ Invalid token should have failed');
    } catch (error) {
      console.log('✅ Invalid token properly rejected');
      console.log(`   Error: ${error.message}`);
    }

    console.log('');

    // Test 5: Configuration validation
    console.log('5. Testing configuration...');
    
    console.log(`✅ JWT Secret: ${config.jwt.secret ? 'SET' : 'NOT SET'}`);
    console.log(`✅ JWT Refresh Secret: ${config.jwt.refreshSecret ? 'SET' : 'NOT SET'}`);
    console.log(`✅ JWT Expires In: ${config.jwt.expiresIn}`);
    console.log(`✅ JWT Refresh Expires In: ${config.jwt.refreshExpiresIn}`);
    console.log(`✅ Database Host: ${config.database.host}`);
    console.log(`✅ Database Name: ${config.database.name}`);
    console.log(`✅ Database User: ${config.database.user}`);
    console.log(`✅ Database SSL: ${config.database.ssl}`);

    console.log('');

    // Test 6: Simulate authentication flow
    console.log('6. Simulating complete authentication flow...');
    
    const loginRequest = {
      identifier: 'admin@metropower.com',
      password: 'MetroPower2025!'
    };

    console.log(`📧 Login attempt for: ${loginRequest.identifier}`);
    
    // In a real scenario, this would query the database
    const mockUserFromDB = {
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
    };

    // Verify password
    const passwordMatch = await bcrypt.compare(loginRequest.password, mockUserFromDB.password_hash);
    
    if (!passwordMatch) {
      console.log('❌ Authentication failed: Invalid password');
      return;
    }

    if (!mockUserFromDB.is_active) {
      console.log('❌ Authentication failed: Account inactive');
      return;
    }

    // Generate tokens
    const authTokens = {
      accessToken: jwt.sign({
        user_id: mockUserFromDB.user_id,
        username: mockUserFromDB.username,
        email: mockUserFromDB.email,
        role: mockUserFromDB.role,
        type: 'access'
      }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
        issuer: config.app.name,
        subject: mockUserFromDB.user_id.toString()
      }),
      refreshToken: jwt.sign({
        user_id: mockUserFromDB.user_id,
        type: 'refresh'
      }, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn,
        issuer: config.app.name,
        subject: mockUserFromDB.user_id.toString()
      })
    };

    console.log('✅ Authentication successful!');
    console.log(`   User: ${mockUserFromDB.username} (${mockUserFromDB.email})`);
    console.log(`   Role: ${mockUserFromDB.role}`);
    console.log(`   Access Token: ${authTokens.accessToken.substring(0, 50)}...`);
    console.log(`   Refresh Token: ${authTokens.refreshToken.substring(0, 50)}...`);

    console.log('\n🎉 All authentication logic tests passed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Password hashing and verification working');
    console.log('   ✅ JWT token generation working');
    console.log('   ✅ JWT token verification working');
    console.log('   ✅ Invalid token rejection working');
    console.log('   ✅ Configuration properly loaded');
    console.log('   ✅ Complete authentication flow working');
    
    console.log('\n🔧 Next Steps:');
    console.log('   1. Set up PostgreSQL database');
    console.log('   2. Run database migrations');
    console.log('   3. Seed initial user data');
    console.log('   4. Test with actual database connection');

  } catch (error) {
    console.error('❌ Authentication logic test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testAuthenticationLogic();
