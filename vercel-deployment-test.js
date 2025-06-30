#!/usr/bin/env node

/**
 * Vercel Deployment Verification Test
 * 
 * Comprehensive test suite to verify that the MetroPower Dashboard
 * is properly deployed to Vercel and all features work correctly
 * in the production environment.
 * 
 * Copyright 2025 The HigherSelf Network
 */

const https = require('https');
const http = require('http');

class VercelDeploymentTest {
    constructor() {
        // Try multiple possible Vercel URLs
        this.possibleUrls = [
            'https://metro-power-manpower-dashboard.vercel.app',
            'https://metropower-manpower-dashboard.vercel.app',
            'https://metro-power-manpower-dashboard-utak-west.vercel.app',
            'https://metropower-manpower-dashboard-utak-west.vercel.app'
        ];
        this.baseUrl = null; // Will be determined during connectivity test
        this.testResults = [];
        this.antoineCredentials = {
            identifier: 'antione.harrell@metropower.com',
            password: 'password123'
        };
    }

    /**
     * Run all deployment verification tests
     */
    async runAllTests() {
        console.log('🚀 Starting Vercel Deployment Verification Tests...\n');

        try {
            // Test 0: Find working deployment URL
            await this.findWorkingDeploymentUrl();

            if (!this.baseUrl) {
                console.log('❌ No working deployment URL found. Deployment may not be active.');
                return;
            }

            console.log(`✅ Found working deployment at: ${this.baseUrl}\n`);

            // Test 1: Basic connectivity and SSL
            await this.testBasicConnectivity();
            
            // Test 2: Frontend assets loading
            await this.testFrontendAssets();
            
            // Test 3: API endpoints availability
            await this.testAPIEndpoints();
            
            // Test 4: Authentication system
            await this.testAuthentication();
            
            // Test 5: Mobile responsiveness
            await this.testMobileResponsiveness();
            
            // Test 6: Database operations
            await this.testDatabaseOperations();
            
            // Test 7: Export functionality
            await this.testExportFunctionality();
            
            // Generate test report
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Vercel deployment tests failed:', error);
            process.exit(1);
        }
    }

    /**
     * Test 0: Find working deployment URL
     */
    async findWorkingDeploymentUrl() {
        console.log('🔍 Searching for active deployment URL...');

        for (const url of this.possibleUrls) {
            try {
                console.log(`  Trying: ${url}`);
                const response = await this.makeRequestToUrl(url, 'GET', '/');

                if (response.statusCode === 200 || response.statusCode === 404) {
                    // 404 is acceptable as it means the server is responding
                    this.baseUrl = url;
                    console.log(`  ✅ Found active deployment: ${url}`);
                    return;
                }
            } catch (error) {
                console.log(`  ❌ ${url}: ${error.message}`);
            }
        }

        console.log('  ❌ No active deployment found');
    }

    /**
     * Test 1: Basic connectivity and SSL
     */
    async testBasicConnectivity() {
        console.log('🌐 Testing basic connectivity and SSL...');
        
        try {
            const response = await this.makeRequest('GET', '/');
            
            if (response.statusCode === 200) {
                this.addTestResult('HTTPS Connectivity', 'PASS', 'Successfully connected to Vercel deployment');
            } else {
                this.addTestResult('HTTPS Connectivity', 'FAIL', `HTTP ${response.statusCode}: ${response.statusMessage}`);
            }
            
            // Test SSL certificate
            if (response.socket && response.socket.authorized) {
                this.addTestResult('SSL Certificate', 'PASS', 'Valid SSL certificate');
            } else {
                this.addTestResult('SSL Certificate', 'WARN', 'SSL certificate validation unclear');
            }
            
        } catch (error) {
            this.addTestResult('Basic Connectivity', 'FAIL', `Connection failed: ${error.message}`);
        }
    }

    /**
     * Test 2: Frontend assets loading
     */
    async testFrontendAssets() {
        console.log('📄 Testing frontend assets...');
        
        const assets = [
            '/css/dashboard.css',
            '/css/components.css',
            '/js/dashboard.js',
            '/js/auth.js',
            '/js/api.js',
            '/js/components.js',
            '/assets/images/metropower-logo.png',
            '/favicon.ico'
        ];
        
        for (const asset of assets) {
            try {
                const response = await this.makeRequest('GET', asset);
                
                if (response.statusCode === 200) {
                    this.addTestResult(`Asset: ${asset}`, 'PASS', 'Asset loads successfully');
                } else {
                    this.addTestResult(`Asset: ${asset}`, 'FAIL', `HTTP ${response.statusCode}`);
                }
                
            } catch (error) {
                this.addTestResult(`Asset: ${asset}`, 'FAIL', `Failed to load: ${error.message}`);
            }
        }
    }

    /**
     * Test 3: API endpoints availability
     */
    async testAPIEndpoints() {
        console.log('🔌 Testing API endpoints...');
        
        const endpoints = [
            { path: '/api/health', method: 'GET', expectedStatus: 200 },
            { path: '/api/auth/demo-login', method: 'POST', expectedStatus: 200 },
            { path: '/api/assignments', method: 'GET', expectedStatus: 401 }, // Should require auth
            { path: '/api/employees', method: 'GET', expectedStatus: 200 }, // Public endpoint
            { path: '/api/projects', method: 'GET', expectedStatus: 200 }  // Public endpoint
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await this.makeRequest(endpoint.method, endpoint.path);
                
                if (response.statusCode === endpoint.expectedStatus) {
                    this.addTestResult(`API: ${endpoint.path}`, 'PASS', `Returns expected HTTP ${endpoint.expectedStatus}`);
                } else {
                    this.addTestResult(`API: ${endpoint.path}`, 'FAIL', `Expected ${endpoint.expectedStatus}, got ${response.statusCode}`);
                }
                
            } catch (error) {
                this.addTestResult(`API: ${endpoint.path}`, 'FAIL', `Request failed: ${error.message}`);
            }
        }
    }

    /**
     * Test 4: Authentication system
     */
    async testAuthentication() {
        console.log('🔐 Testing authentication system...');
        
        try {
            // Test demo login
            const loginData = JSON.stringify({
                identifier: this.antoineCredentials.identifier,
                password: this.antoineCredentials.password
            });
            
            const response = await this.makeRequest('POST', '/api/auth/demo-login', {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(loginData)
            }, loginData);
            
            if (response.statusCode === 200) {
                try {
                    const responseData = JSON.parse(response.data);
                    
                    if (responseData.success && responseData.user) {
                        this.addTestResult('Antione Authentication', 'PASS', `Successfully authenticated: ${responseData.user.first_name} ${responseData.user.last_name}`);
                        
                        // Verify user details
                        if (responseData.user.email === this.antoineCredentials.identifier) {
                            this.addTestResult('User Email Verification', 'PASS', 'Email matches expected value');
                        } else {
                            this.addTestResult('User Email Verification', 'FAIL', 'Email mismatch');
                        }
                        
                        if (responseData.user.role === 'Project Manager') {
                            this.addTestResult('User Role Verification', 'PASS', 'Role is Project Manager');
                        } else {
                            this.addTestResult('User Role Verification', 'FAIL', `Expected Project Manager, got ${responseData.user.role}`);
                        }
                        
                    } else {
                        this.addTestResult('Antione Authentication', 'FAIL', 'Authentication response invalid');
                    }
                    
                } catch (parseError) {
                    this.addTestResult('Antione Authentication', 'FAIL', 'Invalid JSON response');
                }
            } else {
                this.addTestResult('Antione Authentication', 'FAIL', `HTTP ${response.statusCode}: ${response.statusMessage}`);
            }
            
        } catch (error) {
            this.addTestResult('Authentication System', 'FAIL', `Error: ${error.message}`);
        }
    }

    /**
     * Test 5: Mobile responsiveness
     */
    async testMobileResponsiveness() {
        console.log('📱 Testing mobile responsiveness...');
        
        try {
            // Test main pages load correctly
            const pages = ['/', '/assignments.html', '/projects.html', '/staff.html', '/manager.html'];
            
            for (const page of pages) {
                const response = await this.makeRequest('GET', page, {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
                });
                
                if (response.statusCode === 200) {
                    // Check for mobile-responsive meta tag
                    if (response.data.includes('width=device-width')) {
                        this.addTestResult(`Mobile: ${page}`, 'PASS', 'Page has mobile viewport meta tag');
                    } else {
                        this.addTestResult(`Mobile: ${page}`, 'WARN', 'Missing mobile viewport meta tag');
                    }
                } else {
                    this.addTestResult(`Mobile: ${page}`, 'FAIL', `HTTP ${response.statusCode}`);
                }
            }
            
        } catch (error) {
            this.addTestResult('Mobile Responsiveness', 'FAIL', `Error: ${error.message}`);
        }
    }

    /**
     * Test 6: Database operations
     */
    async testDatabaseOperations() {
        console.log('🗄️ Testing database operations...');
        
        try {
            // Test employees endpoint
            const employeesResponse = await this.makeRequest('GET', '/api/employees');
            
            if (employeesResponse.statusCode === 200) {
                try {
                    const employeesData = JSON.parse(employeesResponse.data);
                    
                    if (Array.isArray(employeesData) && employeesData.length > 0) {
                        this.addTestResult('Employee Data', 'PASS', `Retrieved ${employeesData.length} employees`);
                    } else {
                        this.addTestResult('Employee Data', 'WARN', 'No employee data found');
                    }
                    
                } catch (parseError) {
                    this.addTestResult('Employee Data', 'FAIL', 'Invalid JSON response');
                }
            } else {
                this.addTestResult('Employee Data', 'FAIL', `HTTP ${employeesResponse.statusCode}`);
            }
            
            // Test projects endpoint
            const projectsResponse = await this.makeRequest('GET', '/api/projects');
            
            if (projectsResponse.statusCode === 200) {
                try {
                    const projectsData = JSON.parse(projectsResponse.data);
                    
                    if (Array.isArray(projectsData) && projectsData.length > 0) {
                        this.addTestResult('Project Data', 'PASS', `Retrieved ${projectsData.length} projects`);
                    } else {
                        this.addTestResult('Project Data', 'WARN', 'No project data found');
                    }
                    
                } catch (parseError) {
                    this.addTestResult('Project Data', 'FAIL', 'Invalid JSON response');
                }
            } else {
                this.addTestResult('Project Data', 'FAIL', `HTTP ${projectsResponse.statusCode}`);
            }
            
        } catch (error) {
            this.addTestResult('Database Operations', 'FAIL', `Error: ${error.message}`);
        }
    }

    /**
     * Test 7: Export functionality
     */
    async testExportFunctionality() {
        console.log('📊 Testing export functionality...');
        
        // Note: Export functionality testing would require authentication
        // For now, we'll test that the export endpoints exist
        
        try {
            const exportResponse = await this.makeRequest('GET', '/api/exports/employees');
            
            // We expect 401 (unauthorized) since we're not authenticated
            if (exportResponse.statusCode === 401) {
                this.addTestResult('Export Endpoints', 'PASS', 'Export endpoints exist and require authentication');
            } else if (exportResponse.statusCode === 200) {
                this.addTestResult('Export Endpoints', 'PASS', 'Export endpoints accessible');
            } else {
                this.addTestResult('Export Endpoints', 'WARN', `Unexpected response: HTTP ${exportResponse.statusCode}`);
            }
            
        } catch (error) {
            this.addTestResult('Export Functionality', 'FAIL', `Error: ${error.message}`);
        }
    }

    /**
     * Make HTTP request to specific URL
     */
    makeRequestToUrl(baseUrl, method, path, headers = {}, data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(baseUrl + path);

            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'User-Agent': 'MetroPower-Dashboard-Test/1.0',
                    ...headers
                },
                timeout: 10000 // 10 second timeout
            };

            const req = https.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                        headers: res.headers,
                        data: responseData,
                        socket: res.socket
                    });
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (data) {
                req.write(data);
            }

            req.end();
        });
    }

    /**
     * Make HTTP request
     */
    makeRequest(method, path, headers = {}, data = null) {
        return this.makeRequestToUrl(this.baseUrl, method, path, headers, data);
    }

    /**
     * Add test result
     */
    addTestResult(testName, status, message) {
        const result = {
            test: testName,
            status: status,
            message: message,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
        console.log(`  ${statusIcon} ${testName}: ${message}`);
    }

    /**
     * Generate test report
     */
    generateTestReport() {
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const warnings = this.testResults.filter(r => r.status === 'WARN').length;
        
        console.log('\n📊 Vercel Deployment Test Report:');
        console.log('='.repeat(50));
        console.log(`Deployment URL: ${this.baseUrl}`);
        console.log(`Total Tests: ${this.testResults.length}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⚠️ Warnings: ${warnings}`);
        
        const successRate = this.testResults.length > 0 ? 
            (passed / this.testResults.length * 100).toFixed(1) : 0;
        console.log(`📈 Success Rate: ${successRate}%`);
        
        if (failed === 0) {
            console.log('\n🎉 Vercel deployment is working correctly! All critical tests passed.');
        } else {
            console.log('\n⚠️ Some deployment tests failed. Please review the issues above.');
        }
        
        console.log('\n🔗 You can access the dashboard at:');
        console.log(`   ${this.baseUrl}`);
        console.log('\n👤 Login with Antione Harrell:');
        console.log(`   Email: ${this.antoineCredentials.identifier}`);
        console.log(`   Password: ${this.antoineCredentials.password}`);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const test = new VercelDeploymentTest();
    test.runAllTests().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = VercelDeploymentTest;
