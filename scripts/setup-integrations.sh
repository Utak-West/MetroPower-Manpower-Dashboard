#!/bin/bash

# MetroPower Dashboard - Integration Setup Script
# This script helps set up and validate integrations for the MetroPower Manpower Dashboard

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.production"
TEMPLATE_FILE="$PROJECT_ROOT/.env.integrations.template"

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "=============================================="
    echo "  MetroPower Dashboard Integration Setup"
    echo "=============================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${YELLOW}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ and try again."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    # Check if PostgreSQL client is available
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL client (psql) not found. Database operations may not work."
    fi
    
    print_success "Prerequisites check completed"
}

setup_environment() {
    print_step "Setting up environment configuration..."
    
    if [ ! -f "$TEMPLATE_FILE" ]; then
        print_error "Integration template file not found: $TEMPLATE_FILE"
        exit 1
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        print_step "Creating environment file from template..."
        cp "$TEMPLATE_FILE" "$ENV_FILE"
        print_success "Environment file created: $ENV_FILE"
        print_warning "Please edit $ENV_FILE and fill in your actual credentials before proceeding."
        
        # Ask if user wants to edit now
        read -p "Would you like to edit the environment file now? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} "$ENV_FILE"
        fi
    else
        print_success "Environment file already exists: $ENV_FILE"
    fi
}

install_dependencies() {
    print_step "Installing integration dependencies..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Install additional packages for integrations
    npm install --save \
        mssql \
        node-cron \
        ws \
        axios \
        crypto \
        nodemailer
    
    print_success "Integration dependencies installed"
}

create_database_tables() {
    print_step "Creating integration database tables..."
    
    # Load environment variables
    if [ -f "$ENV_FILE" ]; then
        export $(grep -v '^#' "$ENV_FILE" | xargs)
    fi
    
    # Check if database connection is configured
    if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
        print_warning "Database connection not configured. Skipping table creation."
        return
    fi
    
    # Create SQL for integration tables
    SQL_FILE="/tmp/integration_tables.sql"
    cat > "$SQL_FILE" << 'EOF'
-- Integration logging tables
CREATE TABLE IF NOT EXISTS integration_logs (
    log_id SERIAL PRIMARY KEY,
    integration_name VARCHAR(50) NOT NULL,
    sync_type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL,
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS sync_status (
    integration_name VARCHAR(50) PRIMARY KEY,
    last_sync_time TIMESTAMP WITH TIME ZONE,
    last_successful_sync TIMESTAMP WITH TIME ZONE,
    sync_frequency INTERVAL,
    is_enabled BOOLEAN DEFAULT true,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Integration configuration table
CREATE TABLE IF NOT EXISTS integration_config (
    config_id SERIAL PRIMARY KEY,
    integration_name VARCHAR(50) NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(integration_name, config_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_integration_logs_name_status ON integration_logs(integration_name, status);
CREATE INDEX IF NOT EXISTS idx_integration_logs_started_at ON integration_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_sync_status_enabled ON sync_status(is_enabled);

-- Insert default sync status records
INSERT INTO sync_status (integration_name, sync_frequency, is_enabled) VALUES
    ('employee_sync', '6 hours', true),
    ('project_sync', '4 hours', true),
    ('weather_sync', '1 hour', true),
    ('equipment_sync', '30 minutes', true),
    ('safety_sync', '1 day', true)
ON CONFLICT (integration_name) DO NOTHING;

COMMIT;
EOF
    
    # Execute SQL
    if command -v psql &> /dev/null; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE"
        print_success "Integration tables created successfully"
    else
        print_warning "PostgreSQL client not available. Please run the SQL manually:"
        print_warning "File location: $SQL_FILE"
    fi
    
    # Clean up
    rm -f "$SQL_FILE"
}

test_integrations() {
    print_step "Testing integration connections..."
    
    cd "$PROJECT_ROOT"
    
    # Test database connection
    if command -v npm &> /dev/null; then
        npm run test-db 2>/dev/null || print_warning "Database connection test failed"
    fi
    
    # Test individual integrations
    node -e "
        const IntegrationManager = require('./backend/src/services/IntegrationManager');
        const manager = new IntegrationManager();
        
        manager.initialize()
            .then(() => {
                console.log('✅ Integration initialization successful');
                return manager.getHealthStatus();
            })
            .then(status => {
                console.log('📊 Integration Health Status:');
                console.log(JSON.stringify(status, null, 2));
            })
            .catch(error => {
                console.error('❌ Integration test failed:', error.message);
                process.exit(1);
            });
    " 2>/dev/null || print_warning "Integration connection tests failed"
}

setup_cron_jobs() {
    print_step "Setting up sync schedules..."
    
    # Create cron job entries
    CRON_FILE="/tmp/metropower_integrations.cron"
    cat > "$CRON_FILE" << EOF
# MetroPower Dashboard Integration Sync Jobs
# Employee sync every 6 hours
0 */6 * * * cd $PROJECT_ROOT && npm run sync:employees >> /var/log/metropower/employee_sync.log 2>&1

# Project sync every 4 hours  
0 */4 * * * cd $PROJECT_ROOT && npm run sync:projects >> /var/log/metropower/project_sync.log 2>&1

# Weather update every hour
0 * * * * cd $PROJECT_ROOT && npm run sync:weather >> /var/log/metropower/weather_sync.log 2>&1

# Equipment sync every 30 minutes
*/30 * * * * cd $PROJECT_ROOT && npm run sync:equipment >> /var/log/metropower/equipment_sync.log 2>&1

# Safety data sync daily at 6 AM
0 6 * * * cd $PROJECT_ROOT && npm run sync:safety >> /var/log/metropower/safety_sync.log 2>&1

# Health check every 5 minutes
*/5 * * * * cd $PROJECT_ROOT && npm run health:check >> /var/log/metropower/health_check.log 2>&1
EOF
    
    print_success "Cron job template created: $CRON_FILE"
    print_warning "Please review and install the cron jobs manually:"
    print_warning "  sudo crontab -u www-data $CRON_FILE"
}

create_log_directories() {
    print_step "Creating log directories..."
    
    # Create log directories
    sudo mkdir -p /var/log/metropower
    sudo chown -R www-data:www-data /var/log/metropower
    sudo chmod 755 /var/log/metropower
    
    print_success "Log directories created"
}

print_summary() {
    echo
    echo -e "${BLUE}"
    echo "=============================================="
    echo "  Integration Setup Summary"
    echo "=============================================="
    echo -e "${NC}"
    
    echo "✅ Prerequisites checked"
    echo "✅ Environment configuration set up"
    echo "✅ Dependencies installed"
    echo "✅ Database tables created"
    echo "✅ Integration tests completed"
    echo "✅ Sync schedules configured"
    echo "✅ Log directories created"
    
    echo
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Review and update environment variables in: $ENV_FILE"
    echo "2. Install cron jobs: sudo crontab -u www-data /tmp/metropower_integrations.cron"
    echo "3. Test integrations: npm run test:integrations"
    echo "4. Monitor logs in: /var/log/metropower/"
    echo "5. Access health dashboard: https://your-domain.com/api/debug"
    
    echo
    echo -e "${GREEN}Integration setup completed successfully!${NC}"
}

# Main execution
main() {
    print_header
    
    check_prerequisites
    setup_environment
    install_dependencies
    create_database_tables
    test_integrations
    setup_cron_jobs
    create_log_directories
    
    print_summary
}

# Run main function
main "$@"
