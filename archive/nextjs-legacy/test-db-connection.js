const { Pool } = require('pg');

// Test the Neon database connection
async function testConnection() {
  const connectionString = 'postgres://neondb_owner:npg_FIzeB8CoU3tM@ep-small-wildflower-a4s9we42-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';
  
  console.log('Testing Neon PostgreSQL connection...');
  console.log('Connection string:', connectionString.replace(/:[^:@]*@/, ':****@'));
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
    max: 1
  });

  try {
    console.log('Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Connection successful!');
    
    console.log('Testing basic query...');
    const result = await client.query('SELECT version(), current_database(), current_user');
    console.log('✅ Query successful!');
    console.log('Database version:', result.rows[0].version);
    console.log('Current database:', result.rows[0].current_database);
    console.log('Current user:', result.rows[0].current_user);
    
    // Test if tables exist
    console.log('\nChecking for existing tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('✅ Found tables:', tablesResult.rows.map(row => row.table_name).join(', '));
    } else {
      console.log('⚠️  No tables found in public schema');
    }
    
    client.release();
    await pool.end();
    console.log('✅ Connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
