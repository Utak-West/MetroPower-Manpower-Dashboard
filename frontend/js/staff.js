/**
 * Staff Directory Management
 * 
 * Handles staff categorization, filtering, and export functionality
 * for the MetroPower Dashboard.
 */

// Global variables
let employees = [];
let positions = [];
let currentUser = null;
let filteredEmployees = [];

/**
 * Initialize the staff directory page
 */
async function initializePage() {
    try {
        // Verify authentication and get user info
        const userResponse = await api.verifyToken();
        currentUser = userResponse.user;
        displayUserInfo(currentUser);

        // Load initial data
        await Promise.all([
            loadEmployees(),
            loadPositions()
        ]);

        // Initialize the page
        populateFilters();
        updateStatistics();
        displayStaffByPosition();
        displayStaffTable();

    } catch (error) {
        console.error('Failed to initialize page:', error);
        showError('Failed to load page data. Please refresh and try again.');
    }
}

/**
 * Display user information in header
 */
function displayUserInfo(user) {
    const userDisplay = document.getElementById('userDisplay');
    userDisplay.textContent = `${user.first_name} ${user.last_name} (${user.role})`;
}

/**
 * Load employees data
 */
async function loadEmployees() {
    try {
        showLoading('staffLoading');
        hideError('staffError');

        const response = await api.get('/employees');
        employees = response.data || [];
        filteredEmployees = [...employees];
        
        hideLoading('staffLoading');
        
    } catch (error) {
        console.error('Failed to load employees:', error);
        hideLoading('staffLoading');
        showError('Failed to load employees: ' + error.message, 'staffError');
    }
}

/**
 * Load positions data
 */
async function loadPositions() {
    try {
        const response = await api.get('/positions');
        positions = response.data || [];
    } catch (error) {
        console.error('Failed to load positions:', error);
        // Use fallback positions if API fails
        positions = [
            { position_id: 1, name: 'Electrician', code: 'EL', color_code: '#28A745' },
            { position_id: 2, name: 'Field Supervisor', code: 'FS', color_code: '#3B5998' },
            { position_id: 3, name: 'Apprentice', code: 'AP', color_code: '#F7B731' },
            { position_id: 4, name: 'General Laborer', code: 'GL', color_code: '#6F42C1' },
            { position_id: 5, name: 'Temp', code: 'TM', color_code: '#E52822' }
        ];
    }
}

/**
 * Populate filter dropdowns
 */
function populateFilters() {
    const positionFilter = document.getElementById('positionFilter');
    positionFilter.innerHTML = '<option value="">All Positions</option>';
    
    positions.forEach(position => {
        const option = document.createElement('option');
        option.value = position.position_id;
        option.textContent = position.name;
        positionFilter.appendChild(option);
    });
}

/**
 * Update statistics display
 */
function updateStatistics() {
    const stats = calculateStatistics(filteredEmployees);
    const positionStats = calculatePositionStatistics(filteredEmployees);

    document.getElementById('totalEmployees').textContent = stats.total;
    document.getElementById('activeEmployees').textContent = stats.active;
    document.getElementById('ptoEmployees').textContent = stats.ptoLeave;
    document.getElementById('totalPositions').textContent = positions.length;

    // Update additional metrics if elements exist
    updateAdditionalMetrics(stats, positionStats);
}

/**
 * Calculate employee statistics
 */
function calculateStatistics(employeeList) {
    const stats = {
        total: employeeList.length,
        active: 0,
        pto: 0,
        leave: 0,
        military: 0,
        terminated: 0,
        ptoLeave: 0
    };

    employeeList.forEach(emp => {
        const status = emp.status || 'Active';
        switch (status) {
            case 'Active':
                stats.active++;
                break;
            case 'PTO':
                stats.pto++;
                stats.ptoLeave++;
                break;
            case 'Leave':
                stats.leave++;
                stats.ptoLeave++;
                break;
            case 'Military':
                stats.military++;
                break;
            case 'Terminated':
                stats.terminated++;
                break;
        }
    });

    return stats;
}

/**
 * Calculate position-based statistics
 */
function calculatePositionStatistics(employeeList) {
    const positionStats = {};

    positions.forEach(position => {
        positionStats[position.name] = {
            total: 0,
            active: 0,
            inactive: 0,
            color: position.color_code
        };
    });

    employeeList.forEach(emp => {
        const positionName = getPositionName(emp.position_id || emp.position);
        if (positionStats[positionName]) {
            positionStats[positionName].total++;
            if ((emp.status || 'Active') === 'Active') {
                positionStats[positionName].active++;
            } else {
                positionStats[positionName].inactive++;
            }
        }
    });

    return positionStats;
}

/**
 * Update additional metrics display
 */
function updateAdditionalMetrics(stats, positionStats) {
    // Calculate hire date ranges
    const currentYear = new Date().getFullYear();
    const recentHires = filteredEmployees.filter(emp => {
        if (!emp.hire_date) return false;
        const hireYear = new Date(emp.hire_date).getFullYear();
        return hireYear >= currentYear - 1; // Hired within last year
    }).length;

    // Calculate average tenure (simplified)
    const employeesWithHireDate = filteredEmployees.filter(emp => emp.hire_date);
    const avgTenure = employeesWithHireDate.length > 0 ?
        Math.round(employeesWithHireDate.reduce((sum, emp) => {
            const years = (new Date() - new Date(emp.hire_date)) / (1000 * 60 * 60 * 24 * 365);
            return sum + years;
        }, 0) / employeesWithHireDate.length * 10) / 10 : 0;

    // Update additional stat cards if they exist
    const recentHiresEl = document.getElementById('recentHires');
    if (recentHiresEl) recentHiresEl.textContent = recentHires;

    const avgTenureEl = document.getElementById('avgTenure');
    if (avgTenureEl) avgTenureEl.textContent = avgTenure + ' years';

    // Update position breakdown
    updatePositionBreakdown(positionStats);
}

/**
 * Update position breakdown display
 */
function updatePositionBreakdown(positionStats) {
    const breakdownEl = document.getElementById('positionBreakdown');
    if (!breakdownEl) return;

    breakdownEl.innerHTML = '';

    Object.entries(positionStats).forEach(([positionName, stats]) => {
        if (stats.total > 0) {
            const item = document.createElement('div');
            item.className = 'position-breakdown-item';
            item.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem;
                margin-bottom: 0.5rem;
                background: ${stats.color}20;
                border-left: 4px solid ${stats.color};
                border-radius: 4px;
            `;

            item.innerHTML = `
                <span style="font-weight: 500;">${positionName}</span>
                <span style="color: #6c757d;">${stats.active}/${stats.total} active</span>
            `;

            breakdownEl.appendChild(item);
        }
    });
}

/**
 * Display staff organized by position
 */
function displayStaffByPosition() {
    const container = document.getElementById('positionGrid');
    container.innerHTML = '';

    positions.forEach(position => {
        const positionEmployees = filteredEmployees.filter(emp => 
            emp.position_id === position.position_id || emp.position === position.name
        );

        const positionCard = createPositionCard(position, positionEmployees);
        container.appendChild(positionCard);
    });

    container.classList.remove('hidden');
}

/**
 * Create a position card element
 */
function createPositionCard(position, employees) {
    const card = document.createElement('div');
    card.className = 'position-card';

    const header = document.createElement('div');
    header.className = 'position-header';
    header.style.backgroundColor = position.color_code;
    header.innerHTML = `
        <span>${position.name}</span>
        <span class="position-code">${position.code}</span>
    `;

    const employeeList = document.createElement('div');
    employeeList.className = 'employee-list';

    if (employees.length === 0) {
        employeeList.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 1rem;">No employees in this position</div>';
    } else {
        employees.forEach(employee => {
            const employeeItem = document.createElement('div');
            employeeItem.className = 'employee-item';
            
            const statusClass = `status-${(employee.status || 'active').toLowerCase()}`;
            
            employeeItem.innerHTML = `
                <div>
                    <div class="employee-name">${employee.name || `${employee.first_name} ${employee.last_name}`}</div>
                    <div class="employee-id">${employee.employee_id} • ${employee.employee_number || 'No Number'}</div>
                </div>
                <span class="status-badge ${statusClass}">${employee.status || 'Active'}</span>
            `;
            
            employeeList.appendChild(employeeItem);
        });
    }

    card.appendChild(header);
    card.appendChild(employeeList);
    
    return card;
}

/**
 * Display staff in detailed table
 */
function displayStaffTable() {
    const tbody = document.getElementById('staffTableBody');
    tbody.innerHTML = '';
    
    if (filteredEmployees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #6c757d;">No employees found</td></tr>';
        document.getElementById('staffTableContainer').classList.remove('hidden');
        return;
    }
    
    filteredEmployees.forEach(employee => {
        const row = document.createElement('tr');
        
        const positionName = getPositionName(employee.position_id || employee.position);
        const statusClass = `status-${(employee.status || 'active').toLowerCase()}`;
        const hireDate = employee.hire_date ? formatDate(employee.hire_date) : 'N/A';
        const contact = employee.phone || employee.email || 'N/A';
        
        row.innerHTML = `
            <td>${employee.employee_id}</td>
            <td>${employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`}</td>
            <td>${positionName}</td>
            <td><span class="status-badge ${statusClass}">${employee.status || 'Active'}</span></td>
            <td>${employee.employee_number || 'N/A'}</td>
            <td>${hireDate}</td>
            <td>${contact}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    document.getElementById('staffTableContainer').classList.remove('hidden');
}

/**
 * Get position name by ID or return the position if it's already a name
 */
function getPositionName(positionIdOrName) {
    if (typeof positionIdOrName === 'string' && isNaN(positionIdOrName)) {
        return positionIdOrName; // Already a name
    }
    
    const position = positions.find(p => p.position_id === positionIdOrName);
    return position ? position.name : 'Unknown Position';
}

/**
 * Apply filters to employee list
 */
function applyFilters() {
    const positionFilter = document.getElementById('positionFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const hireDateFilter = document.getElementById('hireDateFilter').value;
    const searchInput = document.getElementById('searchInput').value.toLowerCase();

    filteredEmployees = employees.filter(employee => {
        // Position filter
        if (positionFilter && employee.position_id != positionFilter && employee.position !== getPositionName(positionFilter)) {
            return false;
        }

        // Status filter
        if (statusFilter && (employee.status || 'Active') !== statusFilter) {
            return false;
        }

        // Hire date filter
        if (hireDateFilter && employee.hire_date) {
            const hireDate = new Date(employee.hire_date);
            const currentDate = new Date();
            const yearsDiff = (currentDate - hireDate) / (1000 * 60 * 60 * 24 * 365);

            switch (hireDateFilter) {
                case 'last-year':
                    if (yearsDiff > 1) return false;
                    break;
                case 'last-2-years':
                    if (yearsDiff > 2) return false;
                    break;
                case 'last-5-years':
                    if (yearsDiff > 5) return false;
                    break;
                case 'before-2020':
                    if (hireDate.getFullYear() >= 2020) return false;
                    break;
            }
        }

        // Search filter
        if (searchInput) {
            const searchFields = [
                employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`,
                employee.employee_id,
                employee.employee_number || ''
            ].join(' ').toLowerCase();

            if (!searchFields.includes(searchInput)) {
                return false;
            }
        }

        return true;
    });

    // Update displays
    updateStatistics();
    displayStaffByPosition();
    displayStaffTable();
}

/**
 * Clear all filters
 */
function clearFilters() {
    document.getElementById('positionFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('hireDateFilter').value = '';
    document.getElementById('searchInput').value = '';

    filteredEmployees = [...employees];
    updateStatistics();
    displayStaffByPosition();
    displayStaffTable();
}

/**
 * Refresh staff data
 */
async function refreshStaff() {
    await loadEmployees();
    applyFilters();
}

/**
 * Export staff data
 */
async function exportStaff(format) {
    try {
        showMessage('Generating export...', 'info');
        
        const response = await fetch(`${api.baseURL}/exports/employees?format=${format}`, {
            headers: api.getHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Export failed');
        }
        
        if (format === 'csv' || format === 'excel' || format === 'pdf') {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            let fileExtension = format;
            if (format === 'excel') fileExtension = 'xlsx';

            a.download = `staff_directory_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showMessage(`Staff directory exported as ${format.toUpperCase()} successfully!`, 'success');
        } else {
            const data = await response.json();
            console.log('Export data:', data);
            showMessage('Export completed!', 'success');
        }
    } catch (error) {
        console.error('Export failed:', error);
        showMessage('Export failed: ' + error.message, 'error');
    }
}

/**
 * Logout user
 */
function logout() {
    api.setToken(null);
    window.location.href = '/';
}

/**
 * Utility functions
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function showLoading(elementId) {
    document.getElementById(elementId).classList.remove('hidden');
}

function hideLoading(elementId) {
    document.getElementById(elementId).classList.add('hidden');
}

function showError(message, elementId = 'staffError') {
    const errorEl = document.getElementById(elementId);
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
}

function hideError(elementId) {
    document.getElementById(elementId).classList.add('hidden');
}

function showMessage(message, type = 'info') {
    // Create a temporary message element
    const messageEl = document.createElement('div');
    messageEl.className = type === 'error' ? 'error' : 'success';
    messageEl.textContent = message;
    messageEl.style.position = 'fixed';
    messageEl.style.top = '20px';
    messageEl.style.right = '20px';
    messageEl.style.zIndex = '9999';
    messageEl.style.maxWidth = '300px';
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        document.body.removeChild(messageEl);
    }, 3000);
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);
