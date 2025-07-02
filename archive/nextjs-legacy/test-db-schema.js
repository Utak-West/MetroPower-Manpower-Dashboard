const { Pool } = require('pg');

async function validateSchema() {
  const connectionString = 'postgres://neondb_owner:npg_FIzeB8CoU3tM@ep-small-wildflower-a4s9we42-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    max: 1
  });

  try {
    const client = await pool.connect();
    console.log('🔍 Validating database schema...\n');
    
    // Check table structures
    const tables = ['users', 'employees', 'projects', 'assignments', 'positions'];
    
    for (const table of tables) {
      console.log(`📋 Table: ${table}`);
      
      // Get column information
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [table]);
      
      if (columnsResult.rows.length > 0) {
        console.log('  Columns:');
        columnsResult.rows.forEach(col => {
          console.log(`    - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
        });
      } else {
        console.log('  ❌ Table not found or no columns');
      }
      
      // Get row count
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  Records: ${countResult.rows[0].count}\n`);
    }
    
    // Check foreign key relationships
    console.log('🔗 Foreign Key Relationships:');
    const fkResult = await client.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    fkResult.rows.forEach(fk => {
      console.log(`  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    // Check for sample users
    console.log('\n👥 Sample Users:');
    const usersResult = await client.query('SELECT user_id, username, email, role, is_active FROM users LIMIT 5');
    if (usersResult.rows.length > 0) {
      usersResult.rows.forEach(user => {
        console.log(`  - ${user.username} (${user.email}) - ${user.role} - ${user.is_active ? 'Active' : 'Inactive'}`);
      });
    } else {
      console.log('  ⚠️  No users found in database');
    }
    
    client.release();
    await pool.end();
    console.log('\n✅ Schema validation completed');
    
  } catch (error) {
    console.error('❌ Schema validation failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

validateSchema();
