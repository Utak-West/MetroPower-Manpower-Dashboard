/**
 * Integration Manager
 * 
 * Central service for managing all MetroPower system integrations.
 * Handles coordination between different integration services and provides
 * unified interface for sync operations.
 */

const EmployeeSync = require('./EmployeeSync');
const ProjectSync = require('./ProjectSync');
const WeatherService = require('./WeatherService');
const EquipmentSync = require('./EquipmentSync');
const SafetySync = require('./SafetySync');
const { query } = require('../config/database');
const logger = require('../utils/logger');

class IntegrationManager {
  constructor() {
    this.services = {
      employee: new EmployeeSync(),
      project: new ProjectSync(),
      weather: new WeatherService(),
      equipment: new EquipmentSync(),
      safety: new SafetySync()
    };
    
    this.syncStatus = new Map();
  }

  /**
   * Initialize all integrations
   */
  async initialize() {
    try {
      logger.info('Initializing integration services...');
      
      // Test all connections
      const connectionTests = await Promise.allSettled([
        this.services.employee.testConnection(),
        this.services.project.testConnection(),
        this.services.weather.testConnection(),
        this.services.equipment.testConnection(),
        this.services.safety.testConnection()
      ]);

      // Log connection results
      const serviceNames = Object.keys(this.services);
      connectionTests.forEach((result, index) => {
        const serviceName = serviceNames[index];
        if (result.status === 'fulfilled') {
          logger.info(`${serviceName} integration: Connected`);
          this.syncStatus.set(serviceName, { connected: true, lastCheck: new Date() });
        } else {
          logger.error(`${serviceName} integration: Failed - ${result.reason}`);
          this.syncStatus.set(serviceName, { connected: false, lastCheck: new Date(), error: result.reason });
        }
      });

      logger.info('Integration initialization completed');
    } catch (error) {
      logger.error('Integration initialization failed:', error);
      throw error;
    }
  }

  /**
   * Perform full synchronization of all systems
   */
  async performFullSync() {
    const syncResults = {
      started: new Date(),
      results: {},
      completed: null,
      totalRecords: 0,
      errors: []
    };

    try {
      logger.info('Starting full system synchronization...');

      // Log sync start
      await this.logSyncActivity('full_sync', 'started', {});

      // Sync employees first (dependencies for other syncs)
      syncResults.results.employees = await this.syncWithRetry('employee', 'syncEmployees');
      
      // Sync projects
      syncResults.results.projects = await this.syncWithRetry('project', 'syncProjects');
      
      // Sync equipment
      syncResults.results.equipment = await this.syncWithRetry('equipment', 'syncEquipment');
      
      // Sync safety data
      syncResults.results.safety = await this.syncWithRetry('safety', 'syncSafetyData');
      
      // Update weather data
      syncResults.results.weather = await this.syncWithRetry('weather', 'updateWeatherData');

      // Calculate totals
      syncResults.totalRecords = Object.values(syncResults.results)
        .reduce((total, result) => total + (result.recordsProcessed || 0), 0);

      syncResults.completed = new Date();
      
      // Log successful completion
      await this.logSyncActivity('full_sync', 'completed', syncResults);
      
      logger.info(`Full sync completed: ${syncResults.totalRecords} records processed`);
      
      return syncResults;

    } catch (error) {
      syncResults.errors.push(error.message);
      syncResults.completed = new Date();
      
      // Log error
      await this.logSyncActivity('full_sync', 'failed', syncResults);
      
      logger.error('Full sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync specific service with retry logic
   */
  async syncWithRetry(serviceName, methodName, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Syncing ${serviceName} (attempt ${attempt}/${maxRetries})`);
        
        const startTime = Date.now();
        const result = await this.services[serviceName][methodName]();
        const duration = Date.now() - startTime;
        
        // Update sync status
        this.syncStatus.set(serviceName, {
          connected: true,
          lastSync: new Date(),
          lastDuration: duration,
          recordsProcessed: result.recordsProcessed || 0
        });

        return {
          success: true,
          recordsProcessed: result.recordsProcessed || 0,
          duration: duration,
          attempt: attempt
        };

      } catch (error) {
        lastError = error;
        logger.warn(`${serviceName} sync attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    this.syncStatus.set(serviceName, {
      connected: false,
      lastSync: new Date(),
      error: lastError.message
    });

    throw new Error(`${serviceName} sync failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Get health status of all integrations
   */
  async getHealthStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      services: {}
    };

    // Check each service
    for (const [serviceName, serviceStatus] of this.syncStatus.entries()) {
      status.services[serviceName] = {
        connected: serviceStatus.connected,
        lastSync: serviceStatus.lastSync,
        lastCheck: serviceStatus.lastCheck,
        error: serviceStatus.error || null
      };

      // If any service is down, mark overall as degraded
      if (!serviceStatus.connected) {
        status.overall = 'degraded';
      }
    }

    // Check recent sync activity
    const recentSyncs = await query(`
      SELECT integration_name, status, completed_at 
      FROM integration_logs 
      WHERE started_at > NOW() - INTERVAL '1 hour'
      ORDER BY started_at DESC
    `);

    status.recentActivity = recentSyncs.rows;

    return status;
  }

  /**
   * Get sync statistics
   */
  async getSyncStatistics(days = 7) {
    const stats = await query(`
      SELECT 
        integration_name,
        COUNT(*) as total_syncs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_syncs,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_syncs,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration,
        SUM(records_processed) as total_records
      FROM integration_logs 
      WHERE started_at > NOW() - INTERVAL '${days} days'
      GROUP BY integration_name
    `);

    return stats.rows.map(row => ({
      integration: row.integration_name,
      totalSyncs: parseInt(row.total_syncs),
      successfulSyncs: parseInt(row.successful_syncs),
      failedSyncs: parseInt(row.failed_syncs),
      successRate: (parseInt(row.successful_syncs) / parseInt(row.total_syncs) * 100).toFixed(2),
      avgDuration: parseFloat(row.avg_duration).toFixed(2),
      totalRecords: parseInt(row.total_records) || 0
    }));
  }

  /**
   * Log sync activity to database
   */
  async logSyncActivity(integrationName, status, data = {}) {
    try {
      await query(`
        INSERT INTO integration_logs (integration_name, sync_type, status, records_processed, error_message)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        integrationName,
        data.syncType || 'manual',
        status,
        data.recordsProcessed || 0,
        data.error || null
      ]);
    } catch (error) {
      logger.error('Failed to log sync activity:', error);
    }
  }

  /**
   * Emergency stop all sync operations
   */
  async emergencyStop() {
    logger.warn('Emergency stop initiated for all integrations');
    
    // Stop all running sync operations
    for (const [serviceName, service] of Object.entries(this.services)) {
      if (service.stop && typeof service.stop === 'function') {
        try {
          await service.stop();
          logger.info(`Stopped ${serviceName} integration`);
        } catch (error) {
          logger.error(`Failed to stop ${serviceName} integration:`, error);
        }
      }
    }

    // Update sync status
    await query(`
      UPDATE sync_status 
      SET is_enabled = false, 
          last_sync_time = CURRENT_TIMESTAMP 
      WHERE integration_name IN ('employee_sync', 'project_sync', 'equipment_sync', 'safety_sync')
    `);

    logger.warn('All integrations stopped');
  }

  /**
   * Resume all sync operations
   */
  async resumeOperations() {
    logger.info('Resuming integration operations');
    
    // Re-enable sync operations
    await query(`
      UPDATE sync_status 
      SET is_enabled = true, 
          last_sync_time = CURRENT_TIMESTAMP 
      WHERE integration_name IN ('employee_sync', 'project_sync', 'equipment_sync', 'safety_sync')
    `);

    // Reinitialize connections
    await this.initialize();
    
    logger.info('Integration operations resumed');
  }
}

module.exports = IntegrationManager;
