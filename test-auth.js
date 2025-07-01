const http = require('http');

const BASE_URL = 'http://localhost:3001';

async function testAuthentication() {
  console.log('🔐 Testing Authentication System...\n');
  
  const testUsers = [
    {
      name: 'Admin User',
      email: 'admin@metropower.com',
      password: 'MetroPower2025!'
    },
    {
      name: 'Manager User (Antione)',
      email: 'antione.harrell@metropower.com', 
      password: 'MetroPower2025!'
    }
  ];
  
  for (const user of testUsers) {
    console.log(`Testing login for ${user.name} (${user.email})...`);
    
    try {
      // Test login
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        identifier: user.email,
        password: user.password
      });
      
      if (loginResponse.status === 200 && loginResponse.data.success) {
        console.log(`✅ Login successful for ${user.name}`);
        console.log(`   Role: ${loginResponse.data.user.role}`);
        console.log(`   User ID: ${loginResponse.data.user.user_id}`);
        console.log(`   Active: ${loginResponse.data.user.is_active}`);
        
        const token = loginResponse.data.tokens.accessToken;
        
        // Test protected route access
        console.log('   Testing protected route access...');
        const protectedResponse = await axios.get(`${BASE_URL}/api/dashboard/summary`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (protectedResponse.status === 200) {
          console.log('   ✅ Protected route access successful');
        } else {
          console.log('   ❌ Protected route access failed');
        }
        
        // Test role-based access (try to access users endpoint)
        console.log('   Testing role-based access...');
        try {
          const usersResponse = await axios.get(`${BASE_URL}/api/users`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (usersResponse.status === 200) {
            console.log('   ✅ Role-based access successful (can access users)');
          }
        } catch (roleError) {
          if (roleError.response && roleError.response.status === 403) {
            console.log('   ✅ Role-based access working (403 Forbidden as expected)');
          } else {
            console.log('   ⚠️  Unexpected role-based access error:', roleError.response?.status);
          }
        }
        
      } else {
        console.log(`❌ Login failed for ${user.name}: Invalid response`);
      }
      
    } catch (error) {
      console.log(`❌ Login failed for ${user.name}:`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data?.message || error.response.data?.error}`);
      } else {
        console.log(`   Error: ${error.message}`);
      }
    }
    
    console.log(''); // Empty line for readability
  }
  
  // Test invalid credentials
  console.log('Testing invalid credentials...');
  try {
    await axios.post(`${BASE_URL}/api/auth/login`, {
      identifier: 'invalid@email.com',
      password: 'wrongpassword'
    });
    console.log('❌ Invalid credentials test failed - should have been rejected');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Invalid credentials properly rejected');
    } else {
      console.log('⚠️  Unexpected error for invalid credentials:', error.response?.status);
    }
  }
  
  console.log('\n🔐 Authentication testing completed');
}

// Wait a moment for server to be ready, then test
setTimeout(testAuthentication, 2000);
