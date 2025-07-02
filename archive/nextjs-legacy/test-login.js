/**
 * Test Login Functionality
 * This script tests the login API endpoint to identify any issues
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testLogin() {
    console.log('🧪 Testing MetroPower Dashboard Login Functionality');
    console.log('='.repeat(50));
    
    const baseUrl = 'http://localhost:3001';
    const loginEndpoint = `${baseUrl}/api/auth/login`;
    
    // Test credentials
    const testCredentials = [
        {
            name: 'Manager User (Antione)',
            identifier: 'antione.harrell@metropower.com',
            password: 'MetroPower2025!'
        },
        {
            name: 'Admin User',
            identifier: 'admin@metropower.com',
            password: 'MetroPower2025!'
        }
    ];
    
    for (const cred of testCredentials) {
        console.log(`\n🔐 Testing ${cred.name}:`);
        console.log(`   Email: ${cred.identifier}`);
        
        try {
            const response = await fetch(loginEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identifier: cred.identifier,
                    password: cred.password
                })
            });
            
            console.log(`   Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`   ✅ Login successful!`);
                console.log(`   User: ${data.user.first_name} ${data.user.last_name}`);
                console.log(`   Role: ${data.user.role}`);
                console.log(`   Token: ${data.accessToken ? 'Generated' : 'Missing'}`);
                
                // Test token verification
                if (data.accessToken) {
                    console.log(`   🔍 Testing token verification...`);
                    const verifyResponse = await fetch(`${baseUrl}/api/auth/verify`, {
                        headers: {
                            'Authorization': `Bearer ${data.accessToken}`
                        }
                    });
                    console.log(`   Token verification: ${verifyResponse.status} ${verifyResponse.statusText}`);
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.log(`   ❌ Login failed!`);
                console.log(`   Error: ${errorData.message || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.log(`   💥 Network/Connection Error:`);
            console.log(`   ${error.message}`);
        }
    }
    
    // Test invalid credentials
    console.log(`\n🚫 Testing invalid credentials:`);
    try {
        const response = await fetch(loginEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                identifier: 'invalid@test.com',
                password: 'wrongpassword'
            })
        });
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        const data = await response.json().catch(() => ({}));
        console.log(`   Response: ${data.message || 'No message'}`);
        
    } catch (error) {
        console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n📊 Test Summary:');
    console.log('- Backend API is running on http://localhost:3001');
    console.log('- Login endpoint: /api/auth/login');
    console.log('- Manager credentials: antione.harrell@metropower.com / MetroPower2025!');
    console.log('\n💡 If login works via API but fails in browser:');
    console.log('- Check browser console for JavaScript errors');
    console.log('- Verify CORS settings');
    console.log('- Check network tab for failed requests');
    console.log('- Ensure frontend is loading from same origin');
}

// Run the test
testLogin().catch(console.error);
