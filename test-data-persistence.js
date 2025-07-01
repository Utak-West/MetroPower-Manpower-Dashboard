#!/usr/bin/env node

/**
 * Data Persistence Test Script
 * 
 * Tests that all CRUD operations persist data correctly and survive
 * application restarts and page refreshes.
 * 
 * Copyright 2025 The HigherSelf Network
 */

const path = require('path');

// Add the backend src directory to the module path
const backendSrcPath = path.join(__dirname, 'backend', 'src');
process.env.NODE_PATH = backendSrcPath;
require('module').Module._initPaths();

// Set environment for testing
process.env.NODE_ENV = 'production'; // Force persistent database mode
process.env.USE_MEMORY_DB = 'false';
process.env.DEMO_MODE_ENABLED = 'false';

// Set required JWT secrets for testing
process.env.JWT_SECRET = 'test-jwt-secret-for-persistence-testing';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-persistence-testing';

// Mock database connection for testing (will fallback to in-memory if no real DB)
process.env.POSTGRES_URL = 'postgres://test:test@localhost:5432/test';

const logger = require('./backend/src/utils/logger');

class DataPersistenceTest {
    constructor() {
        this.testResults = [];
        this.testEmployeeId = null;
        this.testProjectId = null;
        this.testAssignmentId = null;
    }

    /**
     * Run all data persistence tests
     */
    async runAllTests() {
        console.log('🧪 Starting Data Persistence Tests...\n');
        
        try {
            // Test 1: Database connection and initialization
            await this.testDatabaseConnection();
            
            // Test 2: Employee CRUD persistence
            await this.testEmployeePersistence();
            
            // Test 3: Project CRUD persistence
            await this.testProjectPersistence();
            
            // Test 4: Assignment CRUD persistence
            await this.testAssignmentPersistence();
            
            // Test 5: Data survival after simulated restart
            await this.testDataSurvivalAfterRestart();
            
            // Generate test report
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Data persistence tests failed:', error);
            process.exit(1);
        }
    }

    /**
     * Test 1: Database connection and initialization
     */
    async testDatabaseConnection() {
        console.log('🔌 Testing database connection and initialization...');
        
        try {
            // Test if we can connect to database
            const { connectDatabase } = require('./backend/src/config/database');
            const connection = await connectDatabase();
            
            if (connection) {
                this.addTestResult('Database Connection', 'PASS', 'Successfully connected to persistent database');
            } else {
                this.addTestResult('Database Connection', 'FAIL', 'Failed to connect to persistent database - using in-memory fallback');
                return;
            }
            
            // Test persistent data service initialization
            const PersistentDataService = require('./backend/src/services/persistentDataService');
            await PersistentDataService.initializePersistentData();
            
            this.addTestResult('Database Initialization', 'PASS', 'Persistent data service initialized successfully');
            
        } catch (error) {
            this.addTestResult('Database Connection', 'FAIL', `Database connection failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Test 2: Employee CRUD persistence
     */
    async testEmployeePersistence() {
        console.log('👤 Testing employee CRUD persistence...');
        
        try {
            const Employee = require('./backend/src/models/Employee');
            
            // Test CREATE
            const testEmployeeData = {
                first_name: 'Test',
                last_name: 'Employee',
                trade: 'Electrician',
                level: 'Senior',
                hourly_rate: 35.00,
                status: 'Active',
                phone: '(555) 123-4567',
                email: 'test.employee@metropower.com',
                notes: 'Test employee for persistence testing'
            };
            
            const createdEmployee = await Employee.create(testEmployeeData, 1);
            this.testEmployeeId = createdEmployee.employee_id;
            
            this.addTestResult('Employee Create', 'PASS', `Created employee: ${createdEmployee.name} (${createdEmployee.employee_id})`);
            
            // Test READ
            const retrievedEmployee = await Employee.getById(this.testEmployeeId);
            
            if (retrievedEmployee && retrievedEmployee.name === 'Test Employee') {
                this.addTestResult('Employee Read', 'PASS', 'Successfully retrieved created employee');
            } else {
                this.addTestResult('Employee Read', 'FAIL', 'Failed to retrieve created employee');
            }
            
            // Test UPDATE
            const updateData = {
                first_name: 'Updated',
                last_name: 'Employee',
                phone: '(555) 987-6543',
                notes: 'Updated test employee'
            };
            
            const updatedEmployee = await Employee.update(this.testEmployeeId, updateData, 1);
            
            if (updatedEmployee && updatedEmployee.name === 'Updated Employee') {
                this.addTestResult('Employee Update', 'PASS', 'Successfully updated employee');
            } else {
                this.addTestResult('Employee Update', 'FAIL', 'Failed to update employee');
            }
            
        } catch (error) {
            this.addTestResult('Employee CRUD', 'FAIL', `Employee operations failed: ${error.message}`);
        }
    }

    /**
     * Test 3: Project CRUD persistence
     */
    async testProjectPersistence() {
        console.log('🏗️ Testing project CRUD persistence...');
        
        try {
            const Project = require('./backend/src/models/Project');
            
            // Test CREATE
            const testProjectData = {
                name: 'Test Persistence Project',
                number: 'TEST-001',
                status: 'Active',
                location: 'Test Location',
                description: 'Test project for persistence testing',
                start_date: '2025-01-01',
                end_date: '2025-12-31'
            };
            
            const createdProject = await Project.create(testProjectData, 1);
            this.testProjectId = createdProject.project_id;
            
            this.addTestResult('Project Create', 'PASS', `Created project: ${createdProject.name} (${createdProject.project_id})`);
            
            // Test READ
            const retrievedProject = await Project.getById(this.testProjectId);
            
            if (retrievedProject && retrievedProject.name === 'Test Persistence Project') {
                this.addTestResult('Project Read', 'PASS', 'Successfully retrieved created project');
            } else {
                this.addTestResult('Project Read', 'FAIL', 'Failed to retrieve created project');
            }
            
        } catch (error) {
            this.addTestResult('Project CRUD', 'FAIL', `Project operations failed: ${error.message}`);
        }
    }

    /**
     * Test 4: Assignment CRUD persistence
     */
    async testAssignmentPersistence() {
        console.log('📋 Testing assignment CRUD persistence...');
        
        try {
            if (!this.testEmployeeId || !this.testProjectId) {
                this.addTestResult('Assignment CRUD', 'SKIP', 'Missing employee or project for assignment test');
                return;
            }
            
            const Assignment = require('./backend/src/models/Assignment');
            
            // Test CREATE
            const testAssignmentData = {
                employee_id: this.testEmployeeId,
                project_id: this.testProjectId,
                assignment_date: '2025-07-01',
                notes: 'Test assignment for persistence testing'
            };
            
            const createdAssignment = await Assignment.create(testAssignmentData, 1);
            this.testAssignmentId = createdAssignment.assignment_id;
            
            this.addTestResult('Assignment Create', 'PASS', `Created assignment: ${createdAssignment.assignment_id}`);
            
            // Test READ
            const assignments = await Assignment.getByDateRange('2025-07-01', '2025-07-01');
            const foundAssignment = assignments.find(a => a.assignment_id === this.testAssignmentId);
            
            if (foundAssignment) {
                this.addTestResult('Assignment Read', 'PASS', 'Successfully retrieved created assignment');
            } else {
                this.addTestResult('Assignment Read', 'FAIL', 'Failed to retrieve created assignment');
            }
            
        } catch (error) {
            this.addTestResult('Assignment CRUD', 'FAIL', `Assignment operations failed: ${error.message}`);
        }
    }

    /**
     * Test 5: Data survival after simulated restart
     */
    async testDataSurvivalAfterRestart() {
        console.log('🔄 Testing data survival after simulated restart...');
        
        try {
            // Simulate application restart by clearing module cache and reconnecting
            delete require.cache[require.resolve('./backend/src/config/database')];
            delete require.cache[require.resolve('./backend/src/models/Employee')];
            delete require.cache[require.resolve('./backend/src/models/Project')];
            delete require.cache[require.resolve('./backend/src/models/Assignment')];
            
            // Reconnect to database
            const { connectDatabase } = require('./backend/src/config/database');
            await connectDatabase();
            
            // Test if our test data still exists
            const Employee = require('./backend/src/models/Employee');
            const Project = require('./backend/src/models/Project');
            const Assignment = require('./backend/src/models/Assignment');
            
            // Check employee
            if (this.testEmployeeId) {
                const employee = await Employee.getById(this.testEmployeeId);
                if (employee) {
                    this.addTestResult('Employee Survival', 'PASS', 'Employee data survived restart');
                } else {
                    this.addTestResult('Employee Survival', 'FAIL', 'Employee data lost after restart');
                }
            }
            
            // Check project
            if (this.testProjectId) {
                const project = await Project.getById(this.testProjectId);
                if (project) {
                    this.addTestResult('Project Survival', 'PASS', 'Project data survived restart');
                } else {
                    this.addTestResult('Project Survival', 'FAIL', 'Project data lost after restart');
                }
            }
            
            // Check assignment
            if (this.testAssignmentId) {
                const assignments = await Assignment.getByDateRange('2025-07-01', '2025-07-01');
                const foundAssignment = assignments.find(a => a.assignment_id === this.testAssignmentId);
                if (foundAssignment) {
                    this.addTestResult('Assignment Survival', 'PASS', 'Assignment data survived restart');
                } else {
                    this.addTestResult('Assignment Survival', 'FAIL', 'Assignment data lost after restart');
                }
            }
            
        } catch (error) {
            this.addTestResult('Data Survival', 'FAIL', `Data survival test failed: ${error.message}`);
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
        
        const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'SKIP' ? '⏭️' : '⚠️';
        console.log(`  ${statusIcon} ${testName}: ${message}`);
    }

    /**
     * Generate test report
     */
    generateTestReport() {
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const skipped = this.testResults.filter(r => r.status === 'SKIP').length;
        
        console.log('\n📊 Data Persistence Test Report:');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${this.testResults.length}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⏭️ Skipped: ${skipped}`);
        
        const successRate = this.testResults.length > 0 ? 
            (passed / (this.testResults.length - skipped) * 100).toFixed(1) : 0;
        console.log(`📈 Success Rate: ${successRate}%`);
        
        if (failed === 0) {
            console.log('\n🎉 All data persistence tests passed! CRUD operations are working correctly.');
        } else {
            console.log('\n⚠️ Some data persistence tests failed. Data may not persist correctly.');
        }
        
        console.log('\n💡 Note: This test requires a real database connection.');
        console.log('   For Vercel deployment, ensure Vercel Postgres is properly configured.');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const test = new DataPersistenceTest();
    test.runAllTests().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = DataPersistenceTest;
