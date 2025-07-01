#!/usr/bin/env node
/**
 * MetroPower Dashboard - Production Database Setup Script
 * 
 * This script helps you set up the production database connection
 * and initialize the schema with your Excel data.
 */

const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupProductionDatabase() {
  console.log('🚀 MetroPower Dashboard - Production Database Setup');
  console.log('='.repeat(55));
  
  console.log('\n📋 Current Status:');
  console.log('   ✅ Application deployed to Vercel');
  console.log('   ✅ Production environment configured');
  console.log('   ⚠️  Database connection needed');
  
  console.log('\n🔧 Database Setup Options:');
  console.log('   1. Use existing Neon database (you provide connection string)');
  console.log('   2. Set up new Vercel Postgres database');
  console.log('   3. View current environment variables');
  console.log('   4. Test database connection');
  
  const choice = await question('\nEnter your choice (1-4): ');
  
  switch (choice) {
    case '1':
      await setupNeonDatabase();
      break;
      
    case '2':
      await setupVercelPostgres();
      break;
      
    case '3':
      await viewEnvironmentVariables();
      break;
      
    case '4':
      await testDatabaseConnection();
      break;
      
    default:
      console.log('❌ Invalid choice. Exiting...');
      rl.close();
      return;
  }
}

async function setupNeonDatabase() {
  console.log('\n🔗 Setting up Neon Database Connection');
  console.log('Please provide your Neon PostgreSQL connection string.');
  console.log('It should look like:');
  console.log('postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/database_name?sslmode=require');
  
  const connectionString = await question('\nEnter your Neon connection string: ');
  
  if (!connectionString.startsWith('postgresql://')) {
    console.log('❌ Invalid connection string format. Please try again.');
    return;
  }
  
  try {
    console.log('\n🔄 Adding database connection to Vercel...');
    
    // Add the environment variable
    execSync(`npx vercel env add POSTGRES_URL "${connectionString}" --scope production`, {
      stdio: 'inherit'
    });
    
    console.log('✅ Database connection added successfully!');
    
    // Redeploy to apply the new environment variable
    const redeploy = await question('\nRedeploy to apply database connection? (y/n): ');
    if (redeploy.toLowerCase() === 'y') {
      console.log('🚀 Redeploying...');
      execSync('npx vercel --prod', { stdio: 'inherit' });
      console.log('✅ Redeployment complete!');
      
      await initializeDatabase();
    }
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
  }
}

async function setupVercelPostgres() {
  console.log('\n🔧 Setting up Vercel Postgres Database');
  console.log('To set up Vercel Postgres:');
  console.log('1. Go to: https://vercel.com/utaks-projects/metropower-manpower-dashboard');
  console.log('2. Click "Storage" tab');
  console.log('3. Click "Create Database" → "Postgres"');
  console.log('4. Choose a name (e.g., "metropower-db")');
  console.log('5. Select region: iad1 (same as your deployment)');
  console.log('6. Vercel will automatically add environment variables');
  
  const completed = await question('\nHave you completed the Vercel Postgres setup? (y/n): ');
  if (completed.toLowerCase() === 'y') {
    await initializeDatabase();
  }
}

async function viewEnvironmentVariables() {
  console.log('\n📋 Current Environment Variables:');
  try {
    execSync('npx vercel env ls', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Error viewing environment variables:', error.message);
  }
}

async function testDatabaseConnection() {
  console.log('\n🧪 Testing Database Connection...');
  console.log('Attempting to connect to your production database...');
  
  try {
    const response = await fetch('https://metropower-manpower-dashboard-alscle5f9-utaks-projects.vercel.app/health');
    if (response.ok) {
      console.log('✅ Application is responding');
    } else {
      console.log('⚠️ Application responded with status:', response.status);
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

async function initializeDatabase() {
  console.log('\n🗄️ Initializing Database Schema...');
  console.log('This will create tables and import your Excel data.');
  
  const proceed = await question('Proceed with database initialization? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('Database initialization skipped.');
    rl.close();
    return;
  }
  
  try {
    console.log('🔄 Calling setup endpoint...');
    console.log('URL: https://metropower-manpower-dashboard-alscle5f9-utaks-projects.vercel.app/api/setup-db');
    
    // Since we added DISABLE_VERCEL_AUTH_FOR_SETUP, this should work
    const response = await fetch('https://metropower-manpower-dashboard-alscle5f9-utaks-projects.vercel.app/api/setup-db');
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Database initialization successful!');
      console.log('📊 Results:', JSON.stringify(result, null, 2));
      
      console.log('\n🎉 Production Setup Complete!');
      console.log('🔐 Login Credentials:');
      console.log('   Manager: antione.harrell@metropower.com / MetroPower2025!');
      console.log('   Admin: admin@metropower.com / MetroPower2025!');
      console.log('\n🌐 Access your dashboard at:');
      console.log('   https://metropower-manpower-dashboard-alscle5f9-utaks-projects.vercel.app');
      
    } else {
      console.log('❌ Database initialization failed');
      console.log('Status:', response.status);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    console.log('\n💡 Manual Setup Option:');
    console.log('You can also initialize the database by visiting:');
    console.log('https://metropower-manpower-dashboard-alscle5f9-utaks-projects.vercel.app/api/setup-db');
    console.log('in your browser after logging into Vercel.');
  }
  
  rl.close();
}

// Run the setup
if (require.main === module) {
  setupProductionDatabase().catch(console.error);
}

module.exports = { setupProductionDatabase };
