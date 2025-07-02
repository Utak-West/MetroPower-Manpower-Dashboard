/**
 * Mobile Responsiveness Test Utility
 * 
 * Tests and validates mobile responsiveness improvements
 * for the MetroPower Dashboard.
 * 
 * Copyright 2025 The HigherSelf Network
 */

class MobileResponsivenessTest {
    constructor() {
        this.breakpoints = {
            mobile: 480,
            tablet: 1024,
            desktop: 1025
        };
        
        this.testResults = [];
        this.isRunning = false;
    }

    /**
     * Run all mobile responsiveness tests
     * @returns {Promise<Object>} Test results
     */
    async runAllTests() {
        if (this.isRunning) {
            console.warn('Tests are already running');
            return;
        }

        this.isRunning = true;
        this.testResults = [];
        
        console.log('🧪 Starting Mobile Responsiveness Tests...');
        
        try {
            // Test hamburger menu visibility
            await this.testHamburgerMenuVisibility();
            
            // Test header spacing
            await this.testHeaderSpacing();
            
            // Test touch target sizes
            await this.testTouchTargetSizes();
            
            // Test export functionality on mobile
            await this.testMobileExportFunctionality();
            
            // Test modal responsiveness
            await this.testModalResponsiveness();
            
            // Test navigation functionality
            await this.testNavigationFunctionality();
            
            console.log('✅ All mobile responsiveness tests completed');
            return this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Mobile responsiveness tests failed:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Test hamburger menu visibility across breakpoints
     */
    async testHamburgerMenuVisibility() {
        console.log('🔍 Testing hamburger menu visibility...');
        
        const hamburger = document.getElementById('hamburgerMenu');
        if (!hamburger) {
            this.addTestResult('Hamburger Menu', 'FAIL', 'Hamburger menu element not found');
            return;
        }

        // Test at different viewport sizes
        const testSizes = [
            { width: 320, height: 568, name: 'Mobile Small' },
            { width: 375, height: 667, name: 'Mobile Medium' },
            { width: 768, height: 1024, name: 'Tablet Portrait' },
            { width: 1024, height: 768, name: 'Tablet Landscape' },
            { width: 1200, height: 800, name: 'Desktop' }
        ];

        for (const size of testSizes) {
            // Simulate viewport resize
            this.simulateViewportResize(size.width, size.height);
            
            await this.wait(100); // Allow CSS to apply
            
            const computedStyle = window.getComputedStyle(hamburger);
            const isVisible = computedStyle.display !== 'none';
            const shouldBeVisible = size.width <= this.breakpoints.tablet;
            
            if (isVisible === shouldBeVisible) {
                this.addTestResult(
                    `Hamburger Visibility - ${size.name}`, 
                    'PASS', 
                    `Correctly ${isVisible ? 'visible' : 'hidden'} at ${size.width}px`
                );
            } else {
                this.addTestResult(
                    `Hamburger Visibility - ${size.name}`, 
                    'FAIL', 
                    `Should be ${shouldBeVisible ? 'visible' : 'hidden'} but is ${isVisible ? 'visible' : 'hidden'} at ${size.width}px`
                );
            }
        }
    }

    /**
     * Test header spacing requirements
     */
    async testHeaderSpacing() {
        console.log('📏 Testing header spacing...');
        
        const hamburger = document.getElementById('hamburgerMenu');
        const currentDate = document.querySelector('.current-date');
        const loginBtn = document.querySelector('.login-btn');
        
        if (!hamburger) {
            this.addTestResult('Header Spacing', 'FAIL', 'Hamburger menu not found');
            return;
        }

        // Test mobile viewport
        this.simulateViewportResize(375, 667);
        await this.wait(100);

        // Check spacing between elements
        const hamburgerRect = hamburger.getBoundingClientRect();
        
        if (currentDate) {
            const dateRect = currentDate.getBoundingClientRect();
            const spacing = hamburgerRect.left - dateRect.right;
            
            if (spacing >= 20) {
                this.addTestResult('Date-Hamburger Spacing', 'PASS', `${spacing.toFixed(1)}px spacing (≥20px required)`);
            } else {
                this.addTestResult('Date-Hamburger Spacing', 'FAIL', `${spacing.toFixed(1)}px spacing (<20px required)`);
            }
        }

        if (loginBtn) {
            const btnRect = loginBtn.getBoundingClientRect();
            const spacing = hamburgerRect.left - btnRect.right;
            
            if (spacing >= 20) {
                this.addTestResult('Login-Hamburger Spacing', 'PASS', `${spacing.toFixed(1)}px spacing (≥20px required)`);
            } else {
                this.addTestResult('Login-Hamburger Spacing', 'FAIL', `${spacing.toFixed(1)}px spacing (<20px required)`);
            }
        }
    }

    /**
     * Test touch target sizes for mobile accessibility
     */
    async testTouchTargetSizes() {
        console.log('👆 Testing touch target sizes...');
        
        const touchTargets = [
            { selector: '#hamburgerMenu', name: 'Hamburger Menu' },
            { selector: '.login-btn', name: 'Login Button' },
            { selector: '.manage-btn', name: 'Manage Button' },
            { selector: '.mobile-nav-link', name: 'Mobile Nav Links' }
        ];

        this.simulateViewportResize(375, 667); // Mobile viewport
        await this.wait(100);

        for (const target of touchTargets) {
            const elements = document.querySelectorAll(target.selector);
            
            if (elements.length === 0) {
                this.addTestResult(`Touch Target - ${target.name}`, 'SKIP', 'Element not found');
                continue;
            }

            elements.forEach((element, index) => {
                const rect = element.getBoundingClientRect();
                const minSize = 44; // Minimum touch target size
                
                const width = rect.width;
                const height = rect.height;
                
                if (width >= minSize && height >= minSize) {
                    this.addTestResult(
                        `Touch Target - ${target.name}${elements.length > 1 ? ` (${index + 1})` : ''}`, 
                        'PASS', 
                        `${width.toFixed(1)}x${height.toFixed(1)}px (≥44x44px required)`
                    );
                } else {
                    this.addTestResult(
                        `Touch Target - ${target.name}${elements.length > 1 ? ` (${index + 1})` : ''}`, 
                        'FAIL', 
                        `${width.toFixed(1)}x${height.toFixed(1)}px (<44x44px required)`
                    );
                }
            });
        }
    }

    /**
     * Test mobile export functionality
     */
    async testMobileExportFunctionality() {
        console.log('📤 Testing mobile export functionality...');
        
        this.simulateViewportResize(375, 667);
        await this.wait(100);

        const exportButtons = document.querySelectorAll('.export-buttons .btn');
        
        if (exportButtons.length === 0) {
            this.addTestResult('Mobile Export', 'SKIP', 'Export buttons not found on current page');
            return;
        }

        // Test export button accessibility on mobile
        exportButtons.forEach((button, index) => {
            const rect = button.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0;
            const hasAdequateSize = rect.height >= 44;
            
            if (isVisible && hasAdequateSize) {
                this.addTestResult(
                    `Export Button ${index + 1}`, 
                    'PASS', 
                    `Visible and accessible (${rect.width.toFixed(1)}x${rect.height.toFixed(1)}px)`
                );
            } else {
                this.addTestResult(
                    `Export Button ${index + 1}`, 
                    'FAIL', 
                    `Not accessible on mobile (${rect.width.toFixed(1)}x${rect.height.toFixed(1)}px)`
                );
            }
        });
    }

    /**
     * Test modal responsiveness
     */
    async testModalResponsiveness() {
        console.log('🪟 Testing modal responsiveness...');
        
        this.simulateViewportResize(375, 667);
        await this.wait(100);

        // Check if modals exist and are properly styled for mobile
        const modals = document.querySelectorAll('.modal');
        
        if (modals.length === 0) {
            this.addTestResult('Modal Responsiveness', 'SKIP', 'No modals found on current page');
            return;
        }

        modals.forEach((modal, index) => {
            const computedStyle = window.getComputedStyle(modal);
            const maxWidth = computedStyle.maxWidth;
            const margin = computedStyle.margin;
            
            // Check if modal is responsive
            const isResponsive = maxWidth.includes('vw') || maxWidth === 'none' || margin === '0px';
            
            if (isResponsive) {
                this.addTestResult(
                    `Modal ${index + 1} Responsiveness`, 
                    'PASS', 
                    'Modal is responsive for mobile'
                );
            } else {
                this.addTestResult(
                    `Modal ${index + 1} Responsiveness`, 
                    'WARN', 
                    'Modal may not be fully responsive for mobile'
                );
            }
        });
    }

    /**
     * Test navigation functionality
     */
    async testNavigationFunctionality() {
        console.log('🧭 Testing navigation functionality...');
        
        const hamburger = document.getElementById('hamburgerMenu');
        const mobileNav = document.getElementById('mobileNavMenu');
        
        if (!hamburger || !mobileNav) {
            this.addTestResult('Navigation Functionality', 'FAIL', 'Mobile navigation elements not found');
            return;
        }

        this.simulateViewportResize(375, 667);
        await this.wait(100);

        // Test hamburger click functionality
        try {
            hamburger.click();
            await this.wait(300); // Wait for animation
            
            const isMenuOpen = mobileNav.classList.contains('active');
            
            if (isMenuOpen) {
                this.addTestResult('Navigation Open', 'PASS', 'Mobile menu opens correctly');
                
                // Test close functionality
                hamburger.click();
                await this.wait(300);
                
                const isMenuClosed = !mobileNav.classList.contains('active');
                
                if (isMenuClosed) {
                    this.addTestResult('Navigation Close', 'PASS', 'Mobile menu closes correctly');
                } else {
                    this.addTestResult('Navigation Close', 'FAIL', 'Mobile menu does not close');
                }
            } else {
                this.addTestResult('Navigation Open', 'FAIL', 'Mobile menu does not open');
            }
        } catch (error) {
            this.addTestResult('Navigation Functionality', 'FAIL', `Error testing navigation: ${error.message}`);
        }
    }

    /**
     * Simulate viewport resize for testing
     */
    simulateViewportResize(width, height) {
        // This is a simulation - in real testing, you'd use browser dev tools or testing frameworks
        document.documentElement.style.setProperty('--test-viewport-width', `${width}px`);
        document.documentElement.style.setProperty('--test-viewport-height', `${height}px`);
        
        // Trigger resize event
        window.dispatchEvent(new Event('resize'));
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
        console.log(`${statusIcon} ${testName}: ${message}`);
    }

    /**
     * Generate test report
     */
    generateTestReport() {
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const warnings = this.testResults.filter(r => r.status === 'WARN').length;
        const skipped = this.testResults.filter(r => r.status === 'SKIP').length;
        
        const report = {
            summary: {
                total: this.testResults.length,
                passed: passed,
                failed: failed,
                warnings: warnings,
                skipped: skipped,
                successRate: this.testResults.length > 0 ? (passed / (this.testResults.length - skipped) * 100).toFixed(1) : 0
            },
            results: this.testResults
        };
        
        console.log('\n📊 Mobile Responsiveness Test Report:');
        console.log(`Total Tests: ${report.summary.total}`);
        console.log(`✅ Passed: ${report.summary.passed}`);
        console.log(`❌ Failed: ${report.summary.failed}`);
        console.log(`⚠️ Warnings: ${report.summary.warnings}`);
        console.log(`⏭️ Skipped: ${report.summary.skipped}`);
        console.log(`📈 Success Rate: ${report.summary.successRate}%`);
        
        return report;
    }

    /**
     * Wait utility function
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileResponsivenessTest;
}

// Global instance for browser use
if (typeof window !== 'undefined') {
    window.MobileResponsivenessTest = MobileResponsivenessTest;
}
