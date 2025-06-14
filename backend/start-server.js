/**
 * Server Startup Script
 * Simple script to start the MetroPower Dashboard server
 */

console.log('Starting MetroPower Dashboard Server...');
console.log('Current working directory:', process.cwd());

try {
  // Load environment variables
  require('dotenv').config({ path: '../.env' });
  console.log('✅ Environment variables loaded');
  
  // Start the server
  require('./server');
  
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  console.error(error.stack);
  process.exit(1);
}
