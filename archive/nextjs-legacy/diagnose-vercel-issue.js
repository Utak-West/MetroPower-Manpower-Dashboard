#!/usr/bin/env node

/**
 * Vercel Environment Variable Diagnostic Script
 * 
 * This script helps diagnose why environment variables are not being
 * applied to the Vercel deployment despite being set in the dashboard.
 */

const https = require('https');

class VercelDiagnostic {
    constructor() {
        this.productionUrls = [
            'https://metropower-manpower-dashboard-8hmgfkfk3-utaks-projects.vercel.app',
            'https://metropower-manpower-dashboard-alscle5f9-utaks-projects.vercel.app',
            'https://metropower-manpower-dashboard.vercel.app'
        ];
    }

    async runDiagnostics() {
        console.log('🔍 Running Vercel Environment Variable Diagnostics...\n');

        for (let i = 0; i < this.productionUrls.length; i++) {
            const url = this.productionUrls[i];
            console.log(`\n${'='.repeat(80)}`);
            console.log(`🌐 TESTING DEPLOYMENT ${i + 1}: ${url}`);
            console.log('='.repeat(80));

            await this.diagnoseSingleDeployment(url);
        }

        console.log('\n' + '='.repeat(80));
        console.log('📋 DIAGNOSTIC SUMMARY & RECOMMENDATIONS');
        console.log('='.repeat(80));
        this.provideSummaryAndRecommendations();
    }

    async diagnoseSingleDeployment(baseUrl) {
        // Test 1: Basic connectivity
        console.log('\n1️⃣ Testing basic connectivity...');
        const healthResponse = await this.testEndpoint(baseUrl, '/health');
        
        if (healthResponse.success) {
            console.log('   ✅ Deployment is responding');
        } else {
            console.log(`   ❌ Deployment error: ${healthResponse.error}`);
            console.log('   🔍 This suggests a server-side error, likely database connection');
        }

        // Test 2: Debug endpoint for environment variables
        console.log('\n2️⃣ Checking environment variables...');
        const debugResponse = await this.testEndpoint(baseUrl, '/api/debug');
        
        if (debugResponse.success) {
            try {
                const data = JSON.parse(debugResponse.data);
                this.analyzeEnvironmentVariables(data);
            } catch (error) {
                console.log('   ❌ Failed to parse debug response');
            }
        } else {
            console.log(`   ❌ Debug endpoint failed: ${debugResponse.error}`);
        }

        // Test 3: Check deployment timestamp
        console.log('\n3️⃣ Checking deployment info...');
        await this.checkDeploymentInfo(baseUrl);

        // Test 4: Test database initialization endpoint
        console.log('\n4️⃣ Testing database setup endpoint...');
        const setupResponse = await this.testEndpoint(baseUrl, '/api/setup-db');
        
        if (setupResponse.success) {
            console.log('   ✅ Setup endpoint is accessible');
        } else {
            console.log(`   ❌ Setup endpoint failed: ${setupResponse.error}`);
        }
    }

    analyzeEnvironmentVariables(debugData) {
        const envVars = debugData.checks?.env_vars;
        const dbConnection = debugData.checks?.database_connection;

        console.log(`   📊 Environment: ${debugData.environment}`);
        console.log(`   🔧 Vercel: ${debugData.vercel ? 'Yes' : 'No'}`);
        console.log(`   ⏰ Timestamp: ${debugData.timestamp}`);

        if (envVars) {
            console.log('\n   🔐 Environment Variables Status:');
            console.log(`      POSTGRES_URL: ${envVars.POSTGRES_URL ? '✅ SET' : '❌ MISSING'}`);
            console.log(`      DB_HOST: ${envVars.DB_HOST ? '✅ SET' : '❌ MISSING'}`);
            console.log(`      DB_NAME: ${envVars.DB_NAME ? '✅ SET' : '❌ MISSING'}`);
            console.log(`      DB_USER: ${envVars.DB_USER ? '✅ SET' : '❌ MISSING'}`);
            console.log(`      DB_PASSWORD: ${envVars.DB_PASSWORD ? '✅ SET' : '❌ MISSING'}`);
            console.log(`      JWT_SECRET: ${envVars.JWT_SECRET ? '✅ SET' : '❌ MISSING'}`);

            if (envVars.values) {
                console.log('\n   📝 Environment Variable Values:');
                Object.entries(envVars.values).forEach(([key, value]) => {
                    console.log(`      ${key}: ${value}`);
                });
            }

            // Key diagnostic: Check if POSTGRES_URL is actually being used
            if (envVars.POSTGRES_URL) {
                console.log('\n   ✅ POSTGRES_URL is set - this should work!');
            } else {
                console.log('\n   ❌ POSTGRES_URL is missing - this is the problem!');
                console.log('      The deployment is falling back to localhost connection');
            }
        }

        if (dbConnection) {
            console.log('\n   🗄️ Database Connection Status:');
            console.log(`      Status: ${dbConnection.status}`);
            if (dbConnection.error) {
                console.log(`      Error: ${dbConnection.error}`);
                
                // Analyze the specific error
                if (dbConnection.error.includes('ECONNREFUSED') && dbConnection.error.includes('127.0.0.1')) {
                    console.log('      🔍 Analysis: Trying to connect to localhost - POSTGRES_URL not being used');
                } else if (dbConnection.error.includes('timeout')) {
                    console.log('      🔍 Analysis: Database connection timeout - check Neon database status');
                } else if (dbConnection.error.includes('authentication')) {
                    console.log('      🔍 Analysis: Authentication failed - check database credentials');
                }
            }
        }
    }

    async checkDeploymentInfo(baseUrl) {
        // Try to get deployment info from headers or other sources
        try {
            const response = await this.makeRequest(baseUrl, '/health');
            
            if (response.headers) {
                console.log('   📋 Response Headers:');
                Object.entries(response.headers).forEach(([key, value]) => {
                    if (key.toLowerCase().includes('vercel') || 
                        key.toLowerCase().includes('deployment') ||
                        key.toLowerCase().includes('cache')) {
                        console.log(`      ${key}: ${value}`);
                    }
                });
            }
        } catch (error) {
            console.log('   ⚠️ Could not retrieve deployment headers');
        }
    }

    async testEndpoint(baseUrl, path) {
        try {
            const response = await this.makeRequest(baseUrl, path);
            return {
                success: response.statusCode < 400,
                statusCode: response.statusCode,
                data: response.data,
                error: response.statusCode >= 400 ? `HTTP ${response.statusCode}` : null
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    makeRequest(baseUrl, path) {
        return new Promise((resolve, reject) => {
            const url = `${baseUrl}${path}`;
            
            const request = https.get(url, (response) => {
                let data = '';
                
                response.on('data', (chunk) => {
                    data += chunk;
                });
                
                response.on('end', () => {
                    resolve({
                        statusCode: response.statusCode,
                        headers: response.headers,
                        data: data
                    });
                });
            });
            
            request.on('error', (error) => {
                reject(error);
            });
            
            request.setTimeout(15000, () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    provideSummaryAndRecommendations() {
        console.log('\n🎯 LIKELY CAUSES & SOLUTIONS:');
        console.log('\n1️⃣ Environment Variables Not Applied:');
        console.log('   • Vercel environment variables were set but deployment not redeployed');
        console.log('   • Solution: Go to Vercel → Deployments → Redeploy latest');
        
        console.log('\n2️⃣ Wrong Environment Scope:');
        console.log('   • Environment variables set for Preview/Development instead of Production');
        console.log('   • Solution: Verify variables are set for "Production" environment');
        
        console.log('\n3️⃣ Deployment Cache Issue:');
        console.log('   • Vercel is serving cached version without new environment variables');
        console.log('   • Solution: Force redeploy or clear deployment cache');
        
        console.log('\n4️⃣ Multiple Projects Confusion:');
        console.log('   • Environment variables set on wrong Vercel project');
        console.log('   • Solution: Verify you\'re configuring the correct project');

        console.log('\n🔧 IMMEDIATE ACTIONS TO TRY:');
        console.log('1. Go to Vercel Dashboard → Your Project');
        console.log('2. Settings → Environment Variables');
        console.log('3. Verify POSTGRES_URL is set for "Production"');
        console.log('4. Go to Deployments → Click "Redeploy" on latest');
        console.log('5. Wait for deployment to complete');
        console.log('6. Run this diagnostic script again');

        console.log('\n📞 IF STILL NOT WORKING:');
        console.log('• Check if you have multiple Vercel projects with similar names');
        console.log('• Try setting environment variables via Vercel CLI:');
        console.log('  vercel env add POSTGRES_URL');
        console.log('• Contact Vercel support if environment variables are not being applied');
    }
}

// Run diagnostics if this file is executed directly
if (require.main === module) {
    const diagnostic = new VercelDiagnostic();
    diagnostic.runDiagnostics().catch(error => {
        console.error('Diagnostic failed:', error);
        process.exit(1);
    });
}

module.exports = VercelDiagnostic;
