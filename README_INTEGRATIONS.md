# MetroPower Manpower Dashboard - System Integrations Guide

## 📋 **Overview**

This guide provides comprehensive instructions for integrating the MetroPower Manpower Dashboard with existing MetroPower systems and third-party APIs. The integration framework is designed for the Tucker Branch implementation but is scalable across all MetroPower locations.

## 🔐 **Prerequisites**

### Required Access Credentials from MetroPower IT Department

#### Core MetroPower Systems
- [ ] **Employee Management System (EMS)**
  - Database connection string or API endpoint
  - Service account credentials with read/write permissions
  - Employee data export permissions
  - Position/role management access

- [ ] **Project Management System (PMS)**
  - API access credentials
  - Project data read permissions
  - Assignment management permissions
  - Budget/timeline access (if applicable)

- [ ] **Payroll/HR System**
  - HRIS API credentials
  - Employee schedule access
  - Time tracking integration permissions
  - Benefits/status information access

- [ ] **Existing Workforce Tracking Systems**
  - Time clock system API access
  - GPS tracking system credentials (if applicable)
  - Equipment checkout system access
  - Safety training records access

#### Network and Security Requirements
- [ ] **VPN Access** to MetroPower internal networks
- [ ] **Firewall Rules** for dashboard server IP addresses
- [ ] **SSL Certificates** for secure API communications
- [ ] **Active Directory** integration credentials (if applicable)

### Third-Party API Keys Required
- [ ] **Weather Service API** (OpenWeatherMap, WeatherAPI, or AccuWeather)
- [ ] **Equipment Tracking API** (if using third-party systems)
- [ ] **Safety Compliance API** (OSHA integration, safety training platforms)
- [ ] **Communication Platform APIs** (Slack, Microsoft Teams, or similar)

## 🏢 **Core MetroPower System Integrations**

### 1. Employee Management System Integration

#### Configuration
Create integration configuration file:

```javascript
// backend/src/config/integrations/employee-system.js
module.exports = {
  ems: {
    type: process.env.EMS_TYPE || 'database', // 'database', 'api', 'file'
    connection: {
      host: process.env.EMS_DB_HOST,
      port: process.env.EMS_DB_PORT || 1433,
      database: process.env.EMS_DB_NAME,
      user: process.env.EMS_DB_USER,
      password: process.env.EMS_DB_PASSWORD,
      options: {
        encrypt: true,
        trustServerCertificate: false
      }
    },
    api: {
      baseUrl: process.env.EMS_API_URL,
      apiKey: process.env.EMS_API_KEY,
      timeout: 30000
    },
    sync: {
      schedule: process.env.EMS_SYNC_SCHEDULE || '0 */6 * * *', // Every 6 hours
      batchSize: 100,
      retryAttempts: 3
    }
  }
};
```

#### Environment Variables
```env
# Employee Management System
EMS_TYPE=database
EMS_DB_HOST=metropower-ems.internal.com
EMS_DB_PORT=1433
EMS_DB_NAME=MetroPowerEMS
EMS_DB_USER=dashboard_service
EMS_DB_PASSWORD=secure_password_here
EMS_SYNC_SCHEDULE=0 */6 * * *

# Alternative API Configuration
EMS_API_URL=https://ems.metropower.com/api/v1
EMS_API_KEY=your_ems_api_key_here
```

#### Implementation
```javascript
// backend/src/services/EmployeeSync.js
const sql = require('mssql');
const config = require('../config/integrations/employee-system');

class EmployeeSync {
  async syncEmployees() {
    try {
      const pool = await sql.connect(config.ems.connection);
      
      // Fetch employees from EMS
      const result = await pool.request().query(`
        SELECT 
          EmployeeID,
          FirstName,
          LastName,
          Position,
          Department,
          HireDate,
          Status,
          PhoneNumber,
          Email,
          LastModified
        FROM Employees 
        WHERE Department = 'Tucker Branch'
        AND LastModified > @lastSync
      `);

      // Process and update local database
      for (const emp of result.recordset) {
        await this.updateLocalEmployee(emp);
      }

      console.log(`Synced ${result.recordset.length} employees`);
    } catch (error) {
      console.error('Employee sync failed:', error);
      throw error;
    }
  }

  async updateLocalEmployee(emsEmployee) {
    // Map EMS data to dashboard format
    const employee = {
      employee_id: emsEmployee.EmployeeID,
      name: `${emsEmployee.FirstName} ${emsEmployee.LastName}`,
      position_name: emsEmployee.Position,
      status: this.mapStatus(emsEmployee.Status),
      hire_date: emsEmployee.HireDate,
      phone: emsEmployee.PhoneNumber,
      email: emsEmployee.Email
    };

    // Update or insert into local database
    await this.upsertEmployee(employee);
  }
}
```

### 2. Project Management System Integration

#### Configuration
```javascript
// backend/src/config/integrations/project-system.js
module.exports = {
  pms: {
    apiUrl: process.env.PMS_API_URL,
    apiKey: process.env.PMS_API_KEY,
    clientId: process.env.PMS_CLIENT_ID,
    clientSecret: process.env.PMS_CLIENT_SECRET,
    sync: {
      schedule: process.env.PMS_SYNC_SCHEDULE || '0 */4 * * *', // Every 4 hours
      projectStatuses: ['Active', 'In Progress', 'Planning'],
      branchFilter: 'Tucker Branch'
    }
  }
};
```

#### Environment Variables
```env
# Project Management System
PMS_API_URL=https://projects.metropower.com/api/v2
PMS_API_KEY=your_pms_api_key
PMS_CLIENT_ID=dashboard_client
PMS_CLIENT_SECRET=your_client_secret
PMS_SYNC_SCHEDULE=0 */4 * * *
```

### 3. Payroll/HR System Integration

#### Configuration
```javascript
// backend/src/config/integrations/hr-system.js
module.exports = {
  hris: {
    provider: process.env.HRIS_PROVIDER || 'adp', // 'adp', 'paychex', 'custom'
    adp: {
      clientId: process.env.ADP_CLIENT_ID,
      clientSecret: process.env.ADP_CLIENT_SECRET,
      apiUrl: process.env.ADP_API_URL || 'https://api.adp.com',
      certificatePath: process.env.ADP_CERT_PATH
    },
    sync: {
      schedule: process.env.HRIS_SYNC_SCHEDULE || '0 2 * * *', // Daily at 2 AM
      dataTypes: ['schedules', 'time_off', 'employee_status']
    }
  }
};
```

## 🌐 **Third-Party API Integrations**

### 1. Weather API Integration

#### Configuration
```env
# Weather API
WEATHER_API_PROVIDER=openweathermap
WEATHER_API_KEY=your_openweather_api_key
WEATHER_API_URL=https://api.openweathermap.org/data/2.5
WEATHER_LOCATION_LAT=33.7490
WEATHER_LOCATION_LON=-84.3880
WEATHER_UPDATE_INTERVAL=3600000
```

#### Implementation
```javascript
// backend/src/services/WeatherService.js
class WeatherService {
  async getCurrentWeather() {
    const response = await fetch(
      `${process.env.WEATHER_API_URL}/weather?lat=${process.env.WEATHER_LOCATION_LAT}&lon=${process.env.WEATHER_LOCATION_LON}&appid=${process.env.WEATHER_API_KEY}&units=imperial`
    );
    
    const data = await response.json();
    
    return {
      temperature: data.main.temp,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      visibility: data.visibility,
      safetyAlert: this.assessSafetyConditions(data)
    };
  }

  assessSafetyConditions(weatherData) {
    const alerts = [];
    
    if (weatherData.main.temp > 95) {
      alerts.push('Heat warning - Increase break frequency');
    }
    
    if (weatherData.main.temp < 32) {
      alerts.push('Freezing conditions - Cold weather protocols');
    }
    
    if (weatherData.wind.speed > 25) {
      alerts.push('High wind warning - Secure equipment');
    }
    
    return alerts;
  }
}
```

### 2. Equipment Tracking Integration

#### Configuration
```env
# Equipment Tracking
EQUIPMENT_API_URL=https://equipment.metropower.com/api
EQUIPMENT_API_KEY=your_equipment_api_key
EQUIPMENT_SYNC_INTERVAL=1800000
```

### 3. Safety Compliance Integration

#### Configuration
```env
# Safety Compliance
SAFETY_API_URL=https://safety.metropower.com/api
SAFETY_API_KEY=your_safety_api_key
OSHA_INTEGRATION_ENABLED=true
SAFETY_TRAINING_SYNC=true
```

## ⚙️ **Configuration Setup Procedures**

### Step 1: Environment Variables Setup

Create production environment file:
```bash
# Copy template
cp .env.example .env.production

# Edit with actual values
nano .env.production
```

### Step 2: Database Migration for Integrations

```sql
-- Add integration tracking tables
CREATE TABLE integration_logs (
    log_id SERIAL PRIMARY KEY,
    integration_name VARCHAR(50) NOT NULL,
    sync_type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL,
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE sync_status (
    integration_name VARCHAR(50) PRIMARY KEY,
    last_sync_time TIMESTAMP WITH TIME ZONE,
    last_successful_sync TIMESTAMP WITH TIME ZONE,
    sync_frequency INTERVAL,
    is_enabled BOOLEAN DEFAULT true,
    error_count INTEGER DEFAULT 0
);
```

### Step 3: Sync Scheduler Setup

```javascript
// backend/src/schedulers/IntegrationScheduler.js
const cron = require('node-cron');
const EmployeeSync = require('../services/EmployeeSync');
const ProjectSync = require('../services/ProjectSync');
const WeatherService = require('../services/WeatherService');

class IntegrationScheduler {
  start() {
    // Employee sync every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      await new EmployeeSync().syncEmployees();
    });

    // Project sync every 4 hours
    cron.schedule('0 */4 * * *', async () => {
      await new ProjectSync().syncProjects();
    });

    // Weather update every hour
    cron.schedule('0 * * * *', async () => {
      await new WeatherService().updateWeatherData();
    });
  }
}
```

## 🧪 **Testing and Validation Procedures**

### Integration Test Suite

Create test file:
```javascript
// tests/integration/systems.test.js
describe('MetroPower System Integrations', () => {
  test('Employee Management System Connection', async () => {
    const sync = new EmployeeSync();
    const result = await sync.testConnection();
    expect(result.connected).toBe(true);
  });

  test('Project Management System API', async () => {
    const sync = new ProjectSync();
    const projects = await sync.fetchProjects();
    expect(projects).toBeDefined();
    expect(Array.isArray(projects)).toBe(true);
  });

  test('Weather API Integration', async () => {
    const weather = new WeatherService();
    const data = await weather.getCurrentWeather();
    expect(data.temperature).toBeDefined();
  });
});
```

### Manual Testing Checklist

- [ ] **Employee Data Sync**
  - Verify employee count matches EMS
  - Check position mappings are correct
  - Validate status updates propagate

- [ ] **Project Data Sync**
  - Confirm active projects are imported
  - Verify project details accuracy
  - Test assignment synchronization

- [ ] **Real-time Updates**
  - Test webhook endpoints (if available)
  - Verify data refresh intervals
  - Check error handling

## 🔧 **Troubleshooting Common Issues**

### Connection Issues

**Problem:** Database connection timeouts
```bash
# Test connection
telnet metropower-ems.internal.com 1433

# Check firewall rules
nmap -p 1433 metropower-ems.internal.com
```

**Solution:** 
- Verify VPN connection
- Check firewall rules
- Validate credentials

### Authentication Failures

**Problem:** API authentication errors
```javascript
// Debug API calls
const response = await fetch(apiUrl, {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
});

console.log('Response status:', response.status);
console.log('Response headers:', response.headers);
```

### Data Synchronization Issues

**Problem:** Duplicate or missing records
```sql
-- Check sync logs
SELECT * FROM integration_logs 
WHERE integration_name = 'employee_sync' 
ORDER BY started_at DESC 
LIMIT 10;

-- Verify data integrity
SELECT COUNT(*) FROM employees WHERE created_at > NOW() - INTERVAL '1 day';
```

## 🔒 **Security Considerations**

### API Key Management

1. **Environment Variables Only**
   ```bash
   # Never commit API keys to version control
   echo "*.env*" >> .gitignore
   ```

2. **Key Rotation Schedule**
   - Rotate API keys quarterly
   - Update all environments simultaneously
   - Test integrations after rotation

3. **Access Control**
   ```javascript
   // Implement API key validation
   const validateApiKey = (req, res, next) => {
     const apiKey = req.headers['x-api-key'];
     if (!apiKey || !isValidApiKey(apiKey)) {
       return res.status(401).json({ error: 'Invalid API key' });
     }
     next();
   };
   ```

### Data Protection

1. **Encryption in Transit**
   - Use HTTPS for all API calls
   - Implement certificate pinning
   - Validate SSL certificates

2. **Data Minimization**
   - Only sync required fields
   - Implement data retention policies
   - Regular data cleanup

3. **Audit Logging**
   ```javascript
   // Log all integration activities
   const logIntegrationActivity = (integration, action, data) => {
     logger.info('Integration activity', {
       integration,
       action,
       timestamp: new Date().toISOString(),
       dataHash: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')
     });
   };
   ```

## 📈 **Monitoring and Maintenance**

### Health Check Endpoints

```javascript
// backend/src/routes/health.js
app.get('/api/health/integrations', async (req, res) => {
  const status = {
    employee_sync: await checkEmployeeSync(),
    project_sync: await checkProjectSync(),
    weather_api: await checkWeatherAPI(),
    timestamp: new Date().toISOString()
  };
  
  res.json(status);
});
```

### Performance Monitoring

```javascript
// Monitor sync performance
const monitorSyncPerformance = (integrationName, startTime, recordCount) => {
  const duration = Date.now() - startTime;
  const recordsPerSecond = recordCount / (duration / 1000);
  
  logger.info('Sync performance', {
    integration: integrationName,
    duration,
    recordCount,
    recordsPerSecond
  });
};
```

## 🚀 **Deployment Checklist**

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] Integration tests passing
- [ ] Security review completed
- [ ] Performance benchmarks met

### Post-Deployment
- [ ] Health checks passing
- [ ] Sync schedules active
- [ ] Monitoring alerts configured
- [ ] Documentation updated
- [ ] Team training completed

## 🏗️ **Multi-Branch Scalability**

### Branch-Specific Configuration

```javascript
// backend/src/config/branches.js
module.exports = {
  branches: {
    tucker: {
      name: 'Tucker Branch',
      code: 'TKR',
      timezone: 'America/New_York',
      integrations: {
        ems: { enabled: true, endpoint: 'tucker' },
        pms: { enabled: true, filter: 'Tucker Branch' },
        weather: { lat: 33.7490, lon: -84.3880 }
      }
    },
    atlanta: {
      name: 'Atlanta Branch',
      code: 'ATL',
      timezone: 'America/New_York',
      integrations: {
        ems: { enabled: true, endpoint: 'atlanta' },
        pms: { enabled: true, filter: 'Atlanta Branch' },
        weather: { lat: 33.7490, lon: -84.3880 }
      }
    },
    savannah: {
      name: 'Savannah Branch',
      code: 'SAV',
      timezone: 'America/New_York',
      integrations: {
        ems: { enabled: true, endpoint: 'savannah' },
        pms: { enabled: true, filter: 'Savannah Branch' },
        weather: { lat: 32.0835, lon: -81.0998 }
      }
    }
  }
};
```

### Environment Variables for Multi-Branch

```env
# Branch Configuration
CURRENT_BRANCH=tucker
MULTI_BRANCH_ENABLED=true

# Branch-specific database connections
TUCKER_DB_HOST=tucker-db.metropower.com
ATLANTA_DB_HOST=atlanta-db.metropower.com
SAVANNAH_DB_HOST=savannah-db.metropower.com

# Centralized vs Distributed Data
DATA_ARCHITECTURE=centralized
CENTRAL_DB_HOST=central.metropower.com
```

## 📊 **Advanced Integration Features**

### Real-Time Data Streaming

```javascript
// backend/src/services/RealTimeSync.js
const WebSocket = require('ws');

class RealTimeSync {
  constructor() {
    this.connections = new Map();
  }

  setupWebSocketServer() {
    const wss = new WebSocket.Server({ port: 8080 });

    wss.on('connection', (ws, req) => {
      const branchId = this.extractBranchId(req);
      this.connections.set(branchId, ws);

      ws.on('message', (message) => {
        this.handleRealTimeUpdate(branchId, JSON.parse(message));
      });
    });
  }

  broadcastUpdate(branchId, updateType, data) {
    const ws = this.connections.get(branchId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: updateType,
        data: data,
        timestamp: new Date().toISOString()
      }));
    }
  }
}
```

### Data Validation and Quality Checks

```javascript
// backend/src/services/DataValidator.js
class DataValidator {
  validateEmployeeData(employee) {
    const errors = [];

    if (!employee.employee_id || !/^\d{6}$/.test(employee.employee_id)) {
      errors.push('Invalid employee ID format');
    }

    if (!employee.name || employee.name.length < 2) {
      errors.push('Invalid employee name');
    }

    if (!this.isValidPosition(employee.position)) {
      errors.push('Invalid position code');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  validateProjectData(project) {
    const errors = [];

    if (!project.project_id || !/^PROJ-[A-Z]-\d{5}$/.test(project.project_id)) {
      errors.push('Invalid project ID format');
    }

    if (new Date(project.start_date) > new Date(project.end_date)) {
      errors.push('Start date cannot be after end date');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}
```

### Integration Performance Optimization

```javascript
// backend/src/services/OptimizedSync.js
class OptimizedSync {
  async batchSync(syncFunction, data, batchSize = 100) {
    const results = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(item => syncFunction(item))
      );

      results.push(...batchResults);

      // Add delay between batches to prevent overwhelming the system
      if (i + batchSize < data.length) {
        await this.delay(1000);
      }
    }

    return results;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 🔄 **Backup and Recovery Procedures**

### Integration Data Backup

```bash
#!/bin/bash
# scripts/backup-integration-data.sh

BACKUP_DIR="/var/backups/metropower-dashboard"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR/$DATE"

# Backup integration logs
pg_dump -h $DB_HOST -U $DB_USER -t integration_logs -t sync_status \
  $DB_NAME > "$BACKUP_DIR/$DATE/integration_data.sql"

# Backup configuration files
cp -r backend/src/config/integrations "$BACKUP_DIR/$DATE/"

# Compress backup
tar -czf "$BACKUP_DIR/integration_backup_$DATE.tar.gz" "$BACKUP_DIR/$DATE"

echo "Backup completed: integration_backup_$DATE.tar.gz"
```

### Recovery Procedures

```bash
#!/bin/bash
# scripts/restore-integration-data.sh

BACKUP_FILE=$1
RESTORE_DIR="/tmp/restore_$(date +%s)"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file.tar.gz>"
  exit 1
fi

# Extract backup
mkdir -p "$RESTORE_DIR"
tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

# Restore database
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < "$RESTORE_DIR"/*/integration_data.sql

# Restore configuration
cp -r "$RESTORE_DIR"/*/integrations backend/src/config/

echo "Restoration completed"
```

## 📋 **Integration Maintenance Schedule**

### Daily Tasks

- [ ] Check integration health endpoints
- [ ] Review sync logs for errors
- [ ] Monitor API rate limits
- [ ] Verify data consistency

### Weekly Tasks

- [ ] Performance review of sync operations
- [ ] Update integration documentation
- [ ] Review and rotate API keys (if scheduled)
- [ ] Test backup and recovery procedures

### Monthly Tasks

- [ ] Full integration testing
- [ ] Security audit of API connections
- [ ] Performance optimization review
- [ ] Update integration dependencies

### Quarterly Tasks

- [ ] API key rotation
- [ ] Integration architecture review
- [ ] Disaster recovery testing
- [ ] Capacity planning assessment

## 📞 **Support and Escalation**

### Contact Information

**Primary Support:**

- MetroPower IT Development Team
- Email: <it-development@metropower.com>
- Phone: (555) 123-4567
- On-call: (555) 987-6543

**Escalation Path:**

1. **Level 1:** Branch IT Support
2. **Level 2:** Corporate IT Development
3. **Level 3:** External Integration Vendors
4. **Level 4:** System Architects

### Emergency Procedures

**Integration Failure Response:**

1. Check system health endpoints
2. Review recent sync logs
3. Verify network connectivity
4. Test API credentials
5. Escalate to Level 2 if unresolved within 30 minutes

**Data Inconsistency Response:**

1. Stop automatic sync processes
2. Backup current state
3. Identify discrepancy source
4. Implement manual correction
5. Resume sync after validation

---

**Document Version:** 1.0
**Last Updated:** $(date)
**Next Review:** $(date -d "+3 months")

**For additional support or questions about integrations, contact the MetroPower IT Development Team.**
