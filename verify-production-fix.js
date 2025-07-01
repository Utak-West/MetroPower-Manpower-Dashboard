#!/usr/bin/env node

/**
 * Production Fix Verification Script
 * 
 * This script verifies that the Vercel deployment has been fixed
 * and the database connection is working properly.
 */

const https = require('https');

class ProductionVerifier {
    constructor() {
        this.productionUrls = [
            'https://metropower-manpower-dashboard-8hmgfkfk3-utaks-projects.vercel.app',
            'https://metropower-manpower-dashboard-alscle5f9-utaks-projects.vercel.app',
            'https://metropower-manpower-dashboard.vercel.app'
        ];
        this.workingUrl = null;
    }

    async verifyFix() {
        console.log('🔍 Verifying Production Fix...\n');

        // Step 1: Find working deployment
        await this.findWorkingDeployment();

        if (!this.workingUrl) {
            console.log('❌ No working deployment found');
            return false;
        }

        console.log(`✅ Using deployment: ${this.workingUrl}\n`);

        // Step 2: Test health endpoint
        const healthOk = await this.testHealthEndpoint();
        
        // Step 3: Test debug endpoint for database connection
        const dbOk = await this.testDatabaseConnection();
        
        // Step 4: Test API endpoints
        const apiOk = await this.testApiEndpoints();

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 VERIFICATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Health Endpoint: ${healthOk ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Database Connection: ${dbOk ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`API Endpoints: ${apiOk ? '✅ PASS' : '❌ FAIL'}`);
        
        const allPassed = healthOk && dbOk && apiOk;
        console.log(`\nOverall Status: ${allPassed ? '✅ FIXED' : '❌ NEEDS ATTENTION'}`);
        
        if (allPassed) {
            console.log('\n🎉 Production deployment is working correctly!');
            console.log(`🌐 Dashboard URL: ${this.workingUrl}`);
            console.log('👤 Login credentials:');
            console.log('   Manager: antione.harrell@metropower.com / MetroPower2025!');
            console.log('   Admin: admin@metropower.com / MetroPower2025!');
        } else {
            console.log('\n⚠️  Issues detected. Please check the Vercel environment variables.');
        }

        return allPassed;
    }

    async findWorkingDeployment() {
        console.log('🔍 Testing deployment URLs...');
        
        for (const url of this.productionUrls) {
            try {
                console.log(`  Testing: ${url}`);
                const response = await this.makeRequest(url, '/health');
                
                if (response.statusCode === 200) {
                    this.workingUrl = url;
                    console.log(`  ✅ Working deployment found`);
                    return;
                } else {
                    console.log(`  ❌ HTTP ${response.statusCode}`);
                }
            } catch (error) {
                console.log(`  ❌ ${error.message}`);
            }
        }
    }

    async testHealthEndpoint() {
        console.log('🏥 Testing health endpoint...');
        
        try {
            const response = await this.makeRequest(this.workingUrl, '/health');
            
            if (response.statusCode === 200) {
                const data = JSON.parse(response.data);
                console.log(`  ✅ Health check passed`);
                console.log(`  📊 Status: ${data.status}`);
                console.log(`  🗄️  Database: ${data.database || 'unknown'}`);
                return true;
            } else {
                console.log(`  ❌ Health check failed: HTTP ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            console.log(`  ❌ Health check error: ${error.message}`);
            return false;
        }
    }

    async testDatabaseConnection() {
        console.log('🗄️  Testing database connection...');
        
        try {
            const response = await this.makeRequest(this.workingUrl, '/api/debug');
            
            if (response.statusCode === 200) {
                const data = JSON.parse(response.data);
                const dbConnection = data.checks?.database_connection;
                const envVars = data.checks?.env_vars;
                
                console.log(`  📊 Environment: ${data.environment}`);
                console.log(`  🔧 Vercel: ${data.vercel ? 'Yes' : 'No'}`);
                
                if (envVars?.POSTGRES_URL) {
                    console.log(`  ✅ POSTGRES_URL: Found`);
                } else {
                    console.log(`  ❌ POSTGRES_URL: Missing`);
                }
                
                if (dbConnection?.status === 'success') {
                    console.log(`  ✅ Database connection: Working`);
                    
                    if (data.checks?.tables?.count > 0) {
                        console.log(`  📋 Tables found: ${data.checks.tables.count}`);
                    }
                    
                    if (data.checks?.users?.count > 0) {
                        console.log(`  👥 Users found: ${data.checks.users.count}`);
                    }
                    
                    return true;
                } else {
                    console.log(`  ❌ Database connection: ${dbConnection?.error || 'Failed'}`);
                    return false;
                }
            } else {
                console.log(`  ❌ Debug endpoint failed: HTTP ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            console.log(`  ❌ Database test error: ${error.message}`);
            return false;
        }
    }

    async testApiEndpoints() {
        console.log('🔌 Testing API endpoints...');
        
        const endpoints = [
            '/api-docs',
            '/api/dashboard/health'
        ];
        
        let passCount = 0;
        
        for (const endpoint of endpoints) {
            try {
                const response = await this.makeRequest(this.workingUrl, endpoint);
                
                if (response.statusCode === 200 || response.statusCode === 401) {
                    // 401 is acceptable for protected endpoints
                    console.log(`  ✅ ${endpoint}: OK`);
                    passCount++;
                } else {
                    console.log(`  ❌ ${endpoint}: HTTP ${response.statusCode}`);
                }
            } catch (error) {
                console.log(`  ❌ ${endpoint}: ${error.message}`);
            }
        }
        
        return passCount === endpoints.length;
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
                        data: data
                    });
                });
            });
            
            request.on('error', (error) => {
                reject(error);
            });
            
            request.setTimeout(10000, () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }
}

// Run verification if this file is executed directly
if (require.main === module) {
    const verifier = new ProductionVerifier();
    verifier.verifyFix().catch(error => {
        console.error('Verification failed:', error);
        process.exit(1);
    });
}

module.exports = ProductionVerifier;
