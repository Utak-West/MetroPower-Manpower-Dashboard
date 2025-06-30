/**
 * Database Optimization Utilities
 * 
 * Provides tools for analyzing and optimizing database performance
 * for the MetroPower Dashboard.
 * 
 * Copyright 2025 The HigherSelf Network
 */

const { query } = require('../config/database')
const logger = require('./logger')

class DatabaseOptimizer {
  /**
   * Analyze query performance and suggest optimizations
   * @param {string} sqlQuery - SQL query to analyze
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Analysis results
   */
  static async analyzeQuery(sqlQuery, params = []) {
    try {
      // Get query execution plan
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sqlQuery}`
      const result = await query(explainQuery, params)
      
      const plan = result.rows[0]['QUERY PLAN'][0]
      
      return {
        executionTime: plan['Execution Time'],
        planningTime: plan['Planning Time'],
        totalCost: plan.Plan['Total Cost'],
        actualRows: plan.Plan['Actual Rows'],
        plan: plan.Plan,
        suggestions: this.generateOptimizationSuggestions(plan)
      }
    } catch (error) {
      logger.error('Error analyzing query:', error)
      throw error
    }
  }

  /**
   * Generate optimization suggestions based on query plan
   * @param {Object} plan - Query execution plan
   * @returns {Array} Optimization suggestions
   */
  static generateOptimizationSuggestions(plan) {
    const suggestions = []
    
    if (plan['Execution Time'] > 1000) {
      suggestions.push('Query execution time is high (>1s). Consider adding indexes or optimizing WHERE clauses.')
    }
    
    if (plan.Plan['Node Type'] === 'Seq Scan') {
      suggestions.push('Sequential scan detected. Consider adding an index on the scanned columns.')
    }
    
    if (plan.Plan['Actual Rows'] > plan.Plan['Plan Rows'] * 10) {
      suggestions.push('Row estimate is significantly off. Consider running ANALYZE on the table.')
    }
    
    return suggestions
  }

  /**
   * Get database statistics and health metrics
   * @returns {Promise<Object>} Database health metrics
   */
  static async getDatabaseHealth() {
    try {
      const metrics = {}
      
      // Table sizes
      const tableSizes = await query(`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `)
      metrics.tableSizes = tableSizes.rows
      
      // Index usage statistics
      const indexUsage = await query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
      `)
      metrics.indexUsage = indexUsage.rows
      
      // Connection statistics
      const connections = await query(`
        SELECT 
          state,
          COUNT(*) as count
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state
      `)
      metrics.connections = connections.rows
      
      // Cache hit ratio
      const cacheHitRatio = await query(`
        SELECT 
          ROUND(
            (sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read))) * 100, 2
          ) as cache_hit_ratio
        FROM pg_statio_user_tables
      `)
      metrics.cacheHitRatio = cacheHitRatio.rows[0]?.cache_hit_ratio || 0
      
      return metrics
    } catch (error) {
      logger.error('Error getting database health metrics:', error)
      throw error
    }
  }

  /**
   * Optimize assignment queries with prepared statements
   * @returns {Promise<Object>} Prepared statement definitions
   */
  static async createPreparedStatements() {
    try {
      const statements = {
        // Most common assignment query
        getAssignmentsByDateRange: `
          PREPARE get_assignments_by_date_range (date, date, varchar, varchar) AS
          SELECT 
            a.assignment_id,
            a.employee_id,
            e.name as employee_name,
            e.employee_number,
            e.position_id,
            pos.name as position_name,
            pos.code as position_code,
            pos.color_code as position_color,
            a.project_id,
            p.name as project_name,
            p.number as project_number,
            a.assignment_date,
            a.notes,
            a.created_at,
            a.updated_at
          FROM assignments a
          JOIN employees e ON a.employee_id = e.employee_id
          JOIN positions pos ON e.position_id = pos.position_id
          JOIN projects p ON a.project_id = p.project_id
          WHERE a.assignment_date >= $1 
            AND a.assignment_date <= $2
            AND ($3 IS NULL OR a.project_id = $3)
            AND ($4 IS NULL OR a.employee_id = $4)
          ORDER BY a.assignment_date, p.name, e.name
        `,
        
        // Employee search query
        searchEmployees: `
          PREPARE search_employees (text, int) AS
          SELECT 
            e.employee_id,
            e.name,
            e.position_id,
            p.name as position_name,
            p.code as position_code,
            p.color_code as position_color,
            e.status,
            e.employee_number
          FROM employees e
          LEFT JOIN positions p ON e.position_id = p.position_id
          WHERE (
            e.name ILIKE '%' || $1 || '%' OR 
            e.employee_id ILIKE '%' || $1 || '%' OR 
            e.employee_number ILIKE '%' || $1 || '%'
          ) AND e.status = 'Active'
          ORDER BY 
            CASE 
              WHEN e.name ILIKE $1 || '%' THEN 1
              WHEN e.employee_id ILIKE $1 || '%' THEN 2
              ELSE 3
            END,
            e.name
          LIMIT $2
        `,
        
        // Conflict check query
        checkAssignmentConflict: `
          PREPARE check_assignment_conflict (varchar, date) AS
          SELECT assignment_id 
          FROM assignments 
          WHERE employee_id = $1 AND assignment_date = $2
        `
      }
      
      // Execute prepared statements
      for (const [name, sql] of Object.entries(statements)) {
        try {
          await query(sql)
          logger.info(`Created prepared statement: ${name}`)
        } catch (error) {
          // Statement might already exist, which is fine
          if (!error.message.includes('already exists')) {
            logger.warn(`Failed to create prepared statement ${name}:`, error.message)
          }
        }
      }
      
      return statements
    } catch (error) {
      logger.error('Error creating prepared statements:', error)
      throw error
    }
  }

  /**
   * Run database maintenance tasks
   * @returns {Promise<Object>} Maintenance results
   */
  static async runMaintenance() {
    try {
      const results = {}
      
      // Update table statistics
      logger.info('Updating table statistics...')
      await query('ANALYZE')
      results.analyze = 'completed'
      
      // Vacuum tables (light cleanup)
      const tables = ['assignments', 'employees', 'projects', 'assignment_history']
      for (const table of tables) {
        logger.info(`Vacuuming table: ${table}`)
        await query(`VACUUM (ANALYZE) ${table}`)
      }
      results.vacuum = 'completed'
      
      // Refresh materialized views if they exist
      try {
        await query('REFRESH MATERIALIZED VIEW CONCURRENTLY assignment_summary_stats')
        results.materializedViews = 'refreshed'
      } catch (error) {
        // View might not exist yet
        results.materializedViews = 'skipped'
      }
      
      logger.info('Database maintenance completed successfully')
      return results
    } catch (error) {
      logger.error('Error during database maintenance:', error)
      throw error
    }
  }

  /**
   * Monitor slow queries and log performance issues
   * @param {number} thresholdMs - Threshold in milliseconds for slow queries
   * @returns {Promise<Array>} Slow query reports
   */
  static async monitorSlowQueries(thresholdMs = 1000) {
    try {
      const slowQueries = await query(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows,
          100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
        FROM pg_stat_statements 
        WHERE mean_time > $1
        ORDER BY mean_time DESC
        LIMIT 10
      `, [thresholdMs])
      
      if (slowQueries.rows.length > 0) {
        logger.warn(`Found ${slowQueries.rows.length} slow queries (>${thresholdMs}ms)`)
        slowQueries.rows.forEach(row => {
          logger.warn(`Slow query: ${row.mean_time.toFixed(2)}ms avg - ${row.query.substring(0, 100)}...`)
        })
      }
      
      return slowQueries.rows
    } catch (error) {
      // pg_stat_statements might not be enabled
      logger.debug('Could not monitor slow queries (pg_stat_statements not available)')
      return []
    }
  }
}

module.exports = DatabaseOptimizer
