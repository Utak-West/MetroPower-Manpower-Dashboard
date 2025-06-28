/**
 * Authentication Module
 *
 * Handles authentication state management and user session handling
 * for the MetroPower Dashboard
 *
 * Copyright 2025 The HigherSelf Network
 */

console.log('Auth.js file loaded');

// Global authentication state
let currentUser = null;
let authInitialized = false;

/**
 * Initialize authentication system
 */
function initializeAuth() {
    console.log('Initializing authentication...');
    
    // Initialize notifications if not already done
    if (typeof initializeNotifications === 'function') {
        initializeNotifications();
    }
    
    // Set up logout handlers
    setupLogoutHandlers();
    
    authInitialized = true;
    console.log('Authentication initialized');
}

/**
 * Get current authenticated user
 */
async function getCurrentUser() {
    try {
        if (currentUser) {
            return currentUser;
        }

        if (!api.isAuthenticated()) {
            return null;
        }

        const response = await api.verifyToken();
        currentUser = response.user;
        return currentUser;

    } catch (error) {
        console.error('Failed to get current user:', error);
        currentUser = null;
        return null;
    }
}

/**
 * Login user with credentials
 */
async function login(identifier, password) {
    try {
        const response = await api.login(identifier, password);
        currentUser = response.user;
        
        if (typeof showNotification === 'function') {
            showNotification('Logged in successfully', 'success');
        }
        
        return response;
    } catch (error) {
        console.error('Login failed:', error);
        
        if (typeof showNotification === 'function') {
            showNotification(`Login failed: ${error.message}`, 'error');
        }
        
        throw error;
    }
}

/**
 * Logout current user
 */
async function logout() {
    try {
        await api.logout();
        currentUser = null;
        
        if (typeof showNotification === 'function') {
            showNotification('Logged out successfully', 'success');
        }
        
        // Redirect to main page
        window.location.href = '/index.html';
        
    } catch (error) {
        console.error('Logout failed:', error);
        
        // Even if logout fails on server, clear local state
        currentUser = null;
        api.setToken(null);
        
        if (typeof showNotification === 'function') {
            showNotification('Logged out', 'info');
        }
        
        window.location.href = '/index.html';
    }
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return api.isAuthenticated() && currentUser !== null;
}

/**
 * Verify current authentication token
 */
async function verifyAuthentication() {
    try {
        if (!api.isAuthenticated()) {
            return false;
        }

        const response = await api.verifyToken();
        currentUser = response.user;
        return true;

    } catch (error) {
        console.error('Authentication verification failed:', error);
        currentUser = null;
        api.setToken(null);
        return false;
    }
}

/**
 * Setup logout button handlers
 */
function setupLogoutHandlers() {
    // Find all logout buttons and attach handlers
    const logoutButtons = document.querySelectorAll('.logout-btn, [onclick="logout()"]');
    
    logoutButtons.forEach(button => {
        // Remove any existing onclick handlers
        button.removeAttribute('onclick');
        
        // Add new event listener
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            await logout();
        });
    });
}

/**
 * Require authentication for page access
 */
async function requireAuth() {
    const authenticated = await verifyAuthentication();
    
    if (!authenticated) {
        window.location.href = '/index.html';
        return false;
    }
    
    return true;
}

/**
 * Update user display elements
 */
function updateUserDisplay(user) {
    if (!user) return;
    
    // Update user display elements
    updateElement('userDisplay', `${user.first_name} ${user.last_name} (${user.role})`);
    updateElement('userName', `${user.first_name} ${user.last_name}`);
    updateElement('userRole', user.role);
}

/**
 * Utility function to update element content safely
 */
function updateElement(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = content;
    }
}

/**
 * Demo bypass for development
 */
async function demoBypass() {
    try {
        const response = await api.demoBypass();
        currentUser = response.user;
        
        if (typeof showNotification === 'function') {
            showNotification('Demo login successful', 'success');
        }
        
        return response;
    } catch (error) {
        console.error('Demo bypass failed:', error);
        throw error;
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
    initializeAuth();
}

// Export functions for global access
window.getCurrentUser = getCurrentUser;
window.login = login;
window.logout = logout;
window.isAuthenticated = isAuthenticated;
window.verifyAuthentication = verifyAuthentication;
window.requireAuth = requireAuth;
window.updateUserDisplay = updateUserDisplay;
window.demoBypass = demoBypass;
