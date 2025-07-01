/**
 * Database Initialization Middleware
 * 
 * Ensures database is initialized before processing requests in serverless environments.
 * This middleware is particularly important for Vercel deployments where the database
 * initialization needs to happen at runtime, not build time.
 */

const { initializeDatabase, getInitializationStatus } = require('../utils/runtime-db-init');
const logger = require('../utils/logger');

let initializationInProgress = false;
let initializationPromise = null;

/**
 * Middleware to ensure database initialization
 */
const ensureDatabaseInitialized = async (req, res, next) => {
  try {
    const status = getInitializationStatus();
    
    // If already initialized, continue
    if (status.isInitialized) {
      return next();
    }
    
    // If initialization is in progress, wait for it
    if (status.isInitializing || initializationInProgress) {
      if (!initializationPromise) {
        initializationPromise = initializeDatabase();
      }
      
      logger.info('⏳ Waiting for database initialization to complete...');
      await initializationPromise;
      return next();
    }
    
    // Start initialization
    initializationInProgress = true;
    logger.info('🔄 Starting database initialization for first request...');
    
    try {
      initializationPromise = initializeDatabase();
      const result = await initializationPromise;
      
      if (result.success) {
        logger.info(`✅ Database initialization completed (${result.mode} mode)`);
        
        // Set global demo mode flag
        global.isDemoMode = result.mode === 'demo';
        
        // Initialize data services based on mode
        if (result.mode === 'database') {
          const PersistentDataService = require('../services/persistentDataService');
          await PersistentDataService.initializePersistentData();
        } else {
          const demoService = require('../services/demoService');
          await demoService.initializeDemoData();
        }
        
        initializationInProgress = false;
        return next();
      } else {
        throw new Error('Database initialization failed');
      }
    } catch (error) {
      initializationInProgress = false;
      initializationPromise = null;
      throw error;
    }
    
  } catch (error) {
    logger.error('❌ Database initialization middleware error:', error);
    
    // For API requests, return JSON error
    if (req.path.startsWith('/api/')) {
      return res.status(500).json({
        error: 'Database initialization failed',
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      });
    }
    
    // For web requests, return HTML error page
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>MetroPower Dashboard - Initialization Error</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
          .error-container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .error-title { color: #d32f2f; margin-bottom: 20px; }
          .error-message { color: #666; line-height: 1.6; }
          .retry-button { background: #1976d2; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px; }
          .retry-button:hover { background: #1565c0; }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1 class="error-title">🔧 System Initialization</h1>
          <p class="error-message">
            The MetroPower Dashboard is currently initializing. This may take a moment on first load.
          </p>
          <p class="error-message">
            <strong>Error:</strong> ${error.message}
          </p>
          <button class="retry-button" onclick="window.location.reload()">
            Retry
          </button>
        </div>
      </body>
      </html>
    `);
  }
};

/**
 * Lightweight middleware for health checks that don't require full initialization
 */
const healthCheckMiddleware = (req, res, next) => {
  // Allow health checks to pass through without full initialization
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }
  
  // For all other requests, ensure database initialization
  return ensureDatabaseInitialized(req, res, next);
};

/**
 * Get current initialization status for monitoring
 */
const getMiddlewareStatus = () => {
  const dbStatus = getInitializationStatus();
  return {
    ...dbStatus,
    middlewareInitializing: initializationInProgress,
    hasPromise: !!initializationPromise
  };
};

module.exports = {
  ensureDatabaseInitialized,
  healthCheckMiddleware,
  getMiddlewareStatus
};
