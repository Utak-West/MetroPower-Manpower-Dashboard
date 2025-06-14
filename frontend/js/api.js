/**
 * API Client
 *
 * Handles all API communication for the MetroPower Dashboard
 * with authentication, error handling, and retry logic.
 *
 * Copyright 2025 The HigherSelf Network
 */

class APIClient {
    constructor() {
        this.baseURL = this.getBaseURL();
        this.token = localStorage.getItem('authToken');
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    /**
     * Get base URL for API requests
     */
    getBaseURL() {
        if (window.location.hostname === 'localhost') {
            return 'http://localhost:3001/api';
        }
        return `${window.location.origin}/api`;
    }

    /**
     * Set authentication token
     */
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    /**
     * Get authentication headers
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    /**
     * Make HTTP request with retry logic
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await fetch(url, config);

                if (!response.ok) {
                    if (response.status === 401) {
                        // Clear invalid token
                        this.setToken(null);
                        throw new Error('Authentication required');
                    }

                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                return data;

            } catch (error) {
                console.error(`API request attempt ${attempt} failed:`, error);

                if (attempt === this.retryAttempts) {
                    throw error;
                }

                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
    }

    /**
     * GET request
     */
    async get(endpoint) {
        return this.request(endpoint, {
            method: 'GET'
        });
    }

    /**
     * POST request
     */
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.token;
    }

    /**
     * Login user
     */
    async login(identifier, password) {
        const response = await this.post('/auth/login', {
            identifier,
            password
        });

        if (response.accessToken) {
            this.setToken(response.accessToken);
        }

        return response;
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            await this.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.setToken(null);
        }
    }

    /**
     * Verify authentication token
     */
    async verifyToken() {
        if (!this.token) {
            throw new Error('No token available');
        }

        return this.get('/auth/verify');
    }

    /**
     * Get dashboard data
     */
    async getDashboardData() {
        return this.get('/dashboard/current');
    }

    /**
     * Get dashboard metrics
     */
    async getDashboardMetrics() {
        return this.get('/dashboard/metrics');
    }

    /**
     * Get weekly assignments
     */
    async getWeeklyAssignments(date) {
        return this.get(`/dashboard/week/${date}`);
    }

    /**
     * Get employees
     */
    async getEmployees() {
        return this.get('/employees');
    }

    /**
     * Get unassigned employees
     */
    async getUnassignedEmployees(date) {
        return this.get(`/employees/unassigned/${date}`);
    }

    /**
     * Get projects
     */
    async getProjects() {
        return this.get('/projects');
    }

    /**
     * Get active projects
     */
    async getActiveProjects() {
        return this.get('/projects/active');
    }

    /**
     * Create assignment
     */
    async createAssignment(assignmentData) {
        return this.post('/assignments', assignmentData);
    }

    /**
     * Update assignment
     */
    async updateAssignment(assignmentId, updateData) {
        return this.put(`/assignments/${assignmentId}`, updateData);
    }

    /**
     * Delete assignment
     */
    async deleteAssignment(assignmentId) {
        return this.delete(`/assignments/${assignmentId}`);
    }

    /**
     * Get health status
     */
    async getHealthStatus() {
        return this.get('/dashboard/health');
    }
}

// Create global API client instance
window.api = new APIClient();
