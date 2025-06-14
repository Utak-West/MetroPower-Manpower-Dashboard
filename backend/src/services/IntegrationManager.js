/**
 * Integration Manager
 *
 * Central service for managing all MetroPower system integrations.
 * Handles coordination between different integration services and provides
 * unified interface for sync operations.
 *
 * NOTE: External integrations are disabled for Vercel deployment to prevent
 * dependency issues. This manager now operates in demo/stub mode.
 */

const logger = require('../utils/logger')

// Stub services for demo mode - prevents import errors
class StubService {
  async testConnection() {
    return { connected: false, message: 'Service disabled for demo deployment' }
  }

  async syncEmployees() {
    return { recordsProcessed: 0, message: 'Demo mode - no sync performed' }
  }

  async syncProjects() {
    return { recordsProcessed: 0, message: 'Demo mode - no sync performed' }
  }

  async syncEquipment() {
    return { recordsProcessed: 0, message: 'Demo mode - no sync performed' }
  }

  async syncSafetyData() {
    return { recordsProcessed: 0, message: 'Demo mode - no sync performed' }
  }

  async updateWeatherData() {
    return { recordsProcessed: 0, message: 'Demo mode - no sync performed' }
  }
}

class IntegrationManager {
  constructor () {
    // Use stub services for demo deployment
    this.services = {
      employee: new StubService(),
      project: new StubService(),
      weather: new StubService(),
      equipment: new StubService(),
      safety: new StubService()
    }

    this.syncStatus = new Map()
    this.demoMode = true

    logger.info('IntegrationManager initialized in demo mode - external integrations disabled')
  }

  /**
   * Initialize all integrations (demo mode)
   */
  async initialize () {
    try {
      logger.info('Initializing integration services in demo mode...')

      if (this.demoMode) {
        // Set all services as disconnected for demo mode
        const serviceNames = Object.keys(this.services)
        serviceNames.forEach(serviceName => {
          this.syncStatus.set(serviceName, {
            connected: false,
            lastCheck: new Date(),
            demoMode: true,
            message: 'Service disabled for demo deployment'
          })
          logger.info(`${serviceName} integration: Demo mode (disabled)`)
        })

        logger.info('Integration initialization completed in demo mode')
        return
      }

      // Original initialization code (not used in demo mode)
      const connectionTests = await Promise.allSettled([
        this.services.employee.testConnection(),
        this.services.project.testConnection(),
        this.services.weather.testConnection(),
        this.services.equipment.testConnection(),
        this.services.safety.testConnection()
      ])

      // Log connection results
      const serviceNames = Object.keys(this.services)
      connectionTests.forEach((result, index) => {
        const serviceName = serviceNames[index]
        if (result.status === 'fulfilled') {
          logger.info(`${serviceName} integration: Connected`)
          this.syncStatus.set(serviceName, { connected: true, lastCheck: new Date() })
        } else {
          logger.error(`${serviceName} integration: Failed - ${result.reason}`)
          this.syncStatus.set(serviceName, { connected: false, lastCheck: new Date(), error: result.reason })
        }
      })

      logger.info('Integration initialization completed')
    } catch (error) {
      logger.error('Integration initialization failed:', error)
      // Don't throw error in demo mode
      if (this.demoMode) {
        logger.warn('Continuing in demo mode despite initialization error')
        return
      }
      throw error
    }
  }

  /**
   * Perform full synchronization of all systems (demo mode)
   */
  async performFullSync () {
    const syncResults = {
      started: new Date(),
      results: {},
      completed: null,
      totalRecords: 0,
      errors: [],
      demoMode: this.demoMode
    }

    try {
      if (this.demoMode) {
        logger.info('Starting demo system synchronization (no actual sync performed)...')

        // Simulate sync results for demo
        syncResults.results = {
          employees: { success: true, recordsProcessed: 0, message: 'Demo mode - no sync performed' },
          projects: { success: true, recordsProcessed: 0, message: 'Demo mode - no sync performed' },
          equipment: { success: true, recordsProcessed: 0, message: 'Demo mode - no sync performed' },
          safety: { success: true, recordsProcessed: 0, message: 'Demo mode - no sync performed' },
          weather: { success: true, recordsProcessed: 0, message: 'Demo mode - no sync performed' }
        }

        syncResults.completed = new Date()
        logger.info('Demo sync completed successfully')
        return syncResults
      }

      logger.info('Starting full system synchronization...')

      // Log sync start (only if database is available)
      try {
        await this.logSyncActivity('full_sync', 'started', {})
      } catch (dbError) {
        logger.warn('Could not log sync activity - continuing without logging')
      }

      // Sync employees first (dependencies for other syncs)
      syncResults.results.employees = await this.syncWithRetry('employee', 'syncEmployees')

      // Sync projects
      syncResults.results.projects = await this.syncWithRetry('project', 'syncProjects')

      // Sync equipment
      syncResults.results.equipment = await this.syncWithRetry('equipment', 'syncEquipment')

      // Sync safety data
      syncResults.results.safety = await this.syncWithRetry('safety', 'syncSafetyData')

      // Update weather data
      syncResults.results.weather = await this.syncWithRetry('weather', 'updateWeatherData')

      // Calculate totals
      syncResults.totalRecords = Object.values(syncResults.results)
        .reduce((total, result) => total + (result.recordsProcessed || 0), 0)

      syncResults.completed = new Date()

      // Log successful completion
      try {
        await this.logSyncActivity('full_sync', 'completed', syncResults)
      } catch (dbError) {
        logger.warn('Could not log sync completion - continuing')
      }

      logger.info(`Full sync completed: ${syncResults.totalRecords} records processed`)

      return syncResults
    } catch (error) {
      syncResults.errors.push(error.message)
      syncResults.completed = new Date()

      // Log error (if possible)
      try {
        await this.logSyncActivity('full_sync', 'failed', syncResults)
      } catch (dbError) {
        logger.warn('Could not log sync error - continuing')
      }

      logger.error('Full sync failed:', error)

      // Don't throw error in demo mode
      if (this.demoMode) {
        logger.warn('Sync failed but continuing in demo mode')
        return syncResults
      }
      throw error
    }
  }

  /**
   * Sync specific service with retry logic
   */
  async syncWithRetry (serviceName, methodName, maxRetries = 3) {
    let lastError

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Syncing ${serviceName} (attempt ${attempt}/${maxRetries})`)

        const startTime = Date.now()
        const result = await this.services[serviceName][methodName]()
        const duration = Date.now() - startTime

        // Update sync status
        this.syncStatus.set(serviceName, {
          connected: true,
          lastSync: new Date(),
          lastDuration: duration,
          recordsProcessed: result.recordsProcessed || 0
        })

        return {
          success: true,
          recordsProcessed: result.recordsProcessed || 0,
          duration,
          attempt
        }
      } catch (error) {
        lastError = error
        logger.warn(`${serviceName} sync attempt ${attempt} failed:`, error.message)

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // All retries failed
    this.syncStatus.set(serviceName, {
      connected: false,
      lastSync: new Date(),
      error: lastError.message
    })

    throw new Error(`${serviceName} sync failed after ${maxRetries} attempts: ${lastError.message}`)
  }

  /**
   * Get health status of all integrations (demo mode safe)
   */
  async getHealthStatus () {
    const status = {
      timestamp: new Date().toISOString(),
      overall: this.demoMode ? 'demo' : 'healthy',
      demoMode: this.demoMode,
      services: {}
    }

    // Check each service
    for (const [serviceName, serviceStatus] of this.syncStatus.entries()) {
      status.services[serviceName] = {
        connected: serviceStatus.connected,
        lastSync: serviceStatus.lastSync,
        lastCheck: serviceStatus.lastCheck,
        error: serviceStatus.error || null,
        demoMode: serviceStatus.demoMode || false
      }

      // If any service is down and not in demo mode, mark overall as degraded
      if (!serviceStatus.connected && !this.demoMode) {
        status.overall = 'degraded'
      }
    }

    // Check recent sync activity (skip in demo mode)
    if (!this.demoMode && !global.isDemoMode) {
      try {
        const { query } = require('../config/database')
        const recentSyncs = await query(`
          SELECT integration_name, status, completed_at
          FROM integration_logs
          WHERE started_at > NOW() - INTERVAL '1 hour'
          ORDER BY started_at DESC
        `)
        status.recentActivity = recentSyncs.rows
      } catch (error) {
        logger.warn('Could not fetch recent sync activity:', error.message)
        status.recentActivity = []
      }
    } else {
      status.recentActivity = []
    }

    return status
  }

  /**
   * Get sync statistics (demo mode safe)
   */
  async getSyncStatistics (days = 7) {
    if (this.demoMode || global.isDemoMode) {
      // Return demo statistics
      return [
        {
          integration: 'employee',
          totalSyncs: 0,
          successfulSyncs: 0,
          failedSyncs: 0,
          successRate: '0.00',
          avgDuration: '0.00',
          totalRecords: 0,
          demoMode: true
        },
        {
          integration: 'project',
          totalSyncs: 0,
          successfulSyncs: 0,
          failedSyncs: 0,
          successRate: '0.00',
          avgDuration: '0.00',
          totalRecords: 0,
          demoMode: true
        }
      ]
    }

    try {
      const { query } = require('../config/database')
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
      `)

      return stats.rows.map(row => ({
        integration: row.integration_name,
        totalSyncs: parseInt(row.total_syncs),
        successfulSyncs: parseInt(row.successful_syncs),
        failedSyncs: parseInt(row.failed_syncs),
        successRate: (parseInt(row.successful_syncs) / parseInt(row.total_syncs) * 100).toFixed(2),
        avgDuration: parseFloat(row.avg_duration).toFixed(2),
        totalRecords: parseInt(row.total_records) || 0
      }))
    } catch (error) {
      logger.warn('Could not fetch sync statistics:', error.message)
      return []
    }
  }

  /**
   * Log sync activity to database (demo mode safe)
   */
  async logSyncActivity (integrationName, status, data = {}) {
    try {
      // Skip database logging in demo mode or if database is unavailable
      if (this.demoMode || global.isDemoMode) {
        logger.info(`Demo mode: Would log sync activity - ${integrationName}: ${status}`)
        return
      }

      // Try to import query function dynamically to avoid errors
      const { query } = require('../config/database')

      await query(`
        INSERT INTO integration_logs (integration_name, sync_type, status, records_processed, error_message)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        integrationName,
        data.syncType || 'manual',
        status,
        data.recordsProcessed || 0,
        data.error || null
      ])
    } catch (error) {
      logger.warn('Failed to log sync activity (continuing in demo mode):', error.message)
    }
  }

  /**
   * Emergency stop all sync operations (demo mode safe)
   */
  async emergencyStop () {
    logger.warn('Emergency stop initiated for all integrations')

    if (this.demoMode || global.isDemoMode) {
      logger.info('Demo mode: Emergency stop simulated (no actual operations to stop)')
      return
    }

    // Stop all running sync operations
    for (const [serviceName, service] of Object.entries(this.services)) {
      if (service.stop && typeof service.stop === 'function') {
        try {
          await service.stop()
          logger.info(`Stopped ${serviceName} integration`)
        } catch (error) {
          logger.error(`Failed to stop ${serviceName} integration:`, error)
        }
      }
    }

    // Update sync status (if database is available)
    try {
      const { query } = require('../config/database')
      await query(`
        UPDATE sync_status
        SET is_enabled = false,
            last_sync_time = CURRENT_TIMESTAMP
        WHERE integration_name IN ('employee_sync', 'project_sync', 'equipment_sync', 'safety_sync')
      `)
    } catch (error) {
      logger.warn('Could not update sync status in database:', error.message)
    }

    logger.warn('All integrations stopped')
  }

  /**
   * Resume all sync operations (demo mode safe)
   */
  async resumeOperations () {
    logger.info('Resuming integration operations')

    if (this.demoMode || global.isDemoMode) {
      logger.info('Demo mode: Resume operations simulated')
      await this.initialize()
      return
    }

    // Re-enable sync operations (if database is available)
    try {
      const { query } = require('../config/database')
      await query(`
        UPDATE sync_status
        SET is_enabled = true,
            last_sync_time = CURRENT_TIMESTAMP
        WHERE integration_name IN ('employee_sync', 'project_sync', 'equipment_sync', 'safety_sync')
      `)
    } catch (error) {
      logger.warn('Could not update sync status in database:', error.message)
    }

    // Reinitialize connections
    await this.initialize()

    logger.info('Integration operations resumed')
  }
}

module.exports = IntegrationManager
