#!/usr/bin/env node

/**
 * Authentication Verification Test
 * 
 * Comprehensive test to verify that Antoine Harrell's authentication
 * continues to work properly after all system changes.
 * 
 * Copyright 2025 The HigherSelf Network
 */

const path = require('path');
const fs = require('fs');

// Add the backend src directory to the module path
const backendSrcPath = path.join(__dirname, 'src');
process.env.NODE_PATH = backendSrcPath;
require('module').Module._initPaths();

// Load configuration and dependencies
const config = require('./src/config/app');
const logger = require('./src/utils/logger');
const User = require('./src/models/User');
const demoService = require('./src/services/demoService');

class AuthenticationVerificationTest {
    constructor() {
        this.testResults = [];
        this.antoineCredentials = {
            email: 'antione.harrell@metropower.com',
            password: 'password123',
            expectedRole: 'Project Manager',
            expectedName: 'Antoine Harrell'
        };
    }

    /**
     * Run all authentication verification tests
     */
    async runAllTests() {
        console.log('🔐 Starting Authentication Verification Tests...\n');

        try {
            // Initialize demo data first
            console.log('🚀 Initializing demo data...');
            await demoService.initializeDemoData();
            console.log('✅ Demo data initialized successfully\n');

            // Test 1: Verify Antione's user account exists
            await this.testUserAccountExists();
            
            // Test 2: Test password authentication
            await this.testPasswordAuthentication();
            
            // Test 3: Test JWT token generation
            await this.testTokenGeneration();
            
            // Test 4: Test token verification
            await this.testTokenVerification();
            
            // Test 5: Test role-based authorization
            await this.testRoleAuthorization();
            
            // Test 6: Test session management
            await this.testSessionManagement();
            
            // Test 7: Test demo service integration
            await this.testDemoServiceIntegration();
            
            // Generate test report
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Authentication verification tests failed:', error);
            process.exit(1);
        }
    }

    /**
     * Test 1: Verify Antoine's user account exists
     */
    async testUserAccountExists() {
        console.log('🔍 Testing user account existence...');
        
        try {
            const user = await demoService.findUserByIdentifier(this.antoineCredentials.email);
            
            if (user) {
                this.addTestResult('User Account Exists', 'PASS', `Found user: ${user.first_name} ${user.last_name} (${user.email})`);
                
                // Verify user details
                if (user.email === this.antoineCredentials.email) {
                    this.addTestResult('Email Verification', 'PASS', 'Email matches expected value');
                } else {
                    this.addTestResult('Email Verification', 'FAIL', `Expected ${this.antoineCredentials.email}, got ${user.email}`);
                }
                
                if (user.role === this.antoineCredentials.expectedRole) {
                    this.addTestResult('Role Verification', 'PASS', `Role is ${user.role}`);
                } else {
                    this.addTestResult('Role Verification', 'FAIL', `Expected ${this.antoineCredentials.expectedRole}, got ${user.role}`);
                }
                
                if (user.is_active) {
                    this.addTestResult('Account Status', 'PASS', 'Account is active');
                } else {
                    this.addTestResult('Account Status', 'FAIL', 'Account is inactive');
                }
                
            } else {
                this.addTestResult('User Account Exists', 'FAIL', 'User account not found');
            }
            
        } catch (error) {
            this.addTestResult('User Account Exists', 'FAIL', `Error: ${error.message}`);
        }
    }

    /**
     * Test 2: Test password authentication
     */
    async testPasswordAuthentication() {
        console.log('🔑 Testing password authentication...');
        
        try {
            const authResult = await User.authenticate(
                this.antoineCredentials.email, 
                this.antoineCredentials.password
            );
            
            if (authResult) {
                this.addTestResult('Password Authentication', 'PASS', 'Authentication successful');
                
                // Verify returned user data
                if (authResult.user && authResult.tokens) {
                    this.addTestResult('Auth Response Structure', 'PASS', 'Response contains user and tokens');
                } else {
                    this.addTestResult('Auth Response Structure', 'FAIL', 'Response missing user or tokens');
                }
                
            } else {
                this.addTestResult('Password Authentication', 'FAIL', 'Authentication failed');
            }
            
        } catch (error) {
            this.addTestResult('Password Authentication', 'FAIL', `Error: ${error.message}`);
        }
    }

    /**
     * Test 3: Test JWT token generation
     */
    async testTokenGeneration() {
        console.log('🎫 Testing JWT token generation...');
        
        try {
            const user = await demoService.findUserByIdentifier(this.antoineCredentials.email);
            
            if (!user) {
                this.addTestResult('Token Generation', 'SKIP', 'User not found');
                return;
            }
            
            const accessToken = User.generateAccessToken(user);
            const refreshToken = User.generateRefreshToken(user);
            
            if (accessToken && typeof accessToken === 'string') {
                this.addTestResult('Access Token Generation', 'PASS', 'Access token generated successfully');
            } else {
                this.addTestResult('Access Token Generation', 'FAIL', 'Failed to generate access token');
            }
            
            if (refreshToken && typeof refreshToken === 'string') {
                this.addTestResult('Refresh Token Generation', 'PASS', 'Refresh token generated successfully');
            } else {
                this.addTestResult('Refresh Token Generation', 'FAIL', 'Failed to generate refresh token');
            }
            
        } catch (error) {
            this.addTestResult('Token Generation', 'FAIL', `Error: ${error.message}`);
        }
    }

    /**
     * Test 4: Test token verification
     */
    async testTokenVerification() {
        console.log('✅ Testing token verification...');
        
        try {
            const user = await demoService.findUserByIdentifier(this.antoineCredentials.email);
            
            if (!user) {
                this.addTestResult('Token Verification', 'SKIP', 'User not found');
                return;
            }
            
            const accessToken = User.generateAccessToken(user);
            const decoded = await User.verifyAccessToken(accessToken);
            
            if (decoded) {
                this.addTestResult('Token Verification', 'PASS', 'Token verified successfully');
                
                // Verify token payload
                if (decoded.user_id === user.user_id) {
                    this.addTestResult('Token User ID', 'PASS', 'User ID matches');
                } else {
                    this.addTestResult('Token User ID', 'FAIL', 'User ID mismatch');
                }
                
                if (decoded.email === user.email) {
                    this.addTestResult('Token Email', 'PASS', 'Email matches');
                } else {
                    this.addTestResult('Token Email', 'FAIL', 'Email mismatch');
                }
                
            } else {
                this.addTestResult('Token Verification', 'FAIL', 'Token verification failed');
            }
            
        } catch (error) {
            this.addTestResult('Token Verification', 'FAIL', `Error: ${error.message}`);
        }
    }

    /**
     * Test 5: Test role-based authorization
     */
    async testRoleAuthorization() {
        console.log('👮 Testing role-based authorization...');
        
        try {
            const user = await demoService.findUserByIdentifier(this.antoineCredentials.email);
            
            if (!user) {
                this.addTestResult('Role Authorization', 'SKIP', 'User not found');
                return;
            }
            
            // Test manager permissions
            const managerRoles = ['Admin', 'Project Manager', 'Branch Manager'];
            const hasManagerAccess = managerRoles.includes(user.role);
            
            if (hasManagerAccess) {
                this.addTestResult('Manager Access', 'PASS', `User has ${user.role} role with manager access`);
            } else {
                this.addTestResult('Manager Access', 'FAIL', `User role ${user.role} does not have manager access`);
            }
            
        } catch (error) {
            this.addTestResult('Role Authorization', 'FAIL', `Error: ${error.message}`);
        }
    }

    /**
     * Test 6: Test session management
     */
    async testSessionManagement() {
        console.log('🕐 Testing session management...');
        
        try {
            const authResult = await User.authenticate(
                this.antoineCredentials.email, 
                this.antoineCredentials.password
            );
            
            if (!authResult) {
                this.addTestResult('Session Management', 'SKIP', 'Authentication failed');
                return;
            }
            
            // Test refresh token functionality
            const newTokens = await User.refreshAccessToken(authResult.tokens.refreshToken);
            
            if (newTokens && newTokens.accessToken) {
                this.addTestResult('Token Refresh', 'PASS', 'Refresh token works correctly');
            } else {
                this.addTestResult('Token Refresh', 'FAIL', 'Refresh token failed');
            }
            
        } catch (error) {
            this.addTestResult('Session Management', 'FAIL', `Error: ${error.message}`);
        }
    }

    /**
     * Test 7: Test demo service integration
     */
    async testDemoServiceIntegration() {
        console.log('🎭 Testing demo service integration...');
        
        try {
            // Test demo login functionality
            const demoUser = await demoService.findUserByIdentifier(this.antoineCredentials.email);
            
            if (demoUser) {
                this.addTestResult('Demo Service User Lookup', 'PASS', 'Demo service can find user');
                
                // Test last login update
                const originalLastLogin = demoUser.last_login;
                await demoService.updateUserLastLogin(demoUser.user_id);
                
                const updatedUser = await demoService.findUserByIdentifier(this.antoineCredentials.email);
                
                if (updatedUser.last_login !== originalLastLogin) {
                    this.addTestResult('Last Login Update', 'PASS', 'Last login timestamp updated');
                } else {
                    this.addTestResult('Last Login Update', 'WARN', 'Last login timestamp not changed');
                }
                
            } else {
                this.addTestResult('Demo Service User Lookup', 'FAIL', 'Demo service cannot find user');
            }
            
        } catch (error) {
            this.addTestResult('Demo Service Integration', 'FAIL', `Error: ${error.message}`);
        }
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
        
        const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'WARN' ? '⚠️' : '⏭️';
        console.log(`  ${statusIcon} ${testName}: ${message}`);
    }

    /**
     * Generate test report
     */
    generateTestReport() {
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const warnings = this.testResults.filter(r => r.status === 'WARN').length;
        const skipped = this.testResults.filter(r => r.status === 'SKIP').length;
        
        console.log('\n📊 Authentication Verification Test Report:');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${this.testResults.length}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⚠️ Warnings: ${warnings}`);
        console.log(`⏭️ Skipped: ${skipped}`);
        
        const successRate = this.testResults.length > 0 ? 
            (passed / (this.testResults.length - skipped) * 100).toFixed(1) : 0;
        console.log(`📈 Success Rate: ${successRate}%`);
        
        if (failed === 0) {
            console.log('\n🎉 All authentication tests passed! Antoine can successfully log in.');
        } else {
            console.log('\n⚠️ Some authentication tests failed. Please review the issues above.');
        }
        
        // Save detailed report to file
        const reportData = {
            summary: {
                total: this.testResults.length,
                passed: passed,
                failed: failed,
                warnings: warnings,
                skipped: skipped,
                successRate: successRate
            },
            results: this.testResults,
            timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'auth-verification-report.json'), 
            JSON.stringify(reportData, null, 2)
        );
        
        console.log('\n📄 Detailed report saved to: auth-verification-report.json');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const test = new AuthenticationVerificationTest();
    test.runAllTests().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = AuthenticationVerificationTest;
