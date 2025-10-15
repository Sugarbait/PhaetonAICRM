import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cpkslvmydfdevdftieck.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkwMDI5NSwiZXhwIjoyMDYyNDc2Mjk1fQ.5Nwr-DrgL63DwPMH2egxgdjoHGhAxCvIrz2SMTMKqD0'

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkSchema() {
  console.log('Checking users table schema...\n')
  
  const { data, error } = await client.rpc('get_table_columns', { table_name: 'users' })
  
  if (error) {
    console.log('RPC not available, using direct query...')
    // Alternative: Query information_schema
    const { data: columns, error: colError } = await client
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'users')
      .eq('table_schema', 'public')
    
    if (colError) {
      console.log('Error:', colError.message)
      console.log('\nTrying raw SQL query...')
      
      // Try with raw SQL
      const { data: sqlData, error: sqlError } = await client.rpc('exec_sql', {
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users'
          ORDER BY ordinal_position;
        `
      })
      
      if (sqlError) {
        console.log('SQL Error:', sqlError.message)
      } else {
        console.log('Users table columns:')
        console.log(sqlData)
      }
    } else {
      console.log('Users table columns:')
      columns.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
      })
    }
  } else {
    console.log('Schema data:', data)
  }
  
  // Try to describe the table by attempting an insert with minimal data
  console.log('\nAttempting test insert to see field requirements...')
  const testId = crypto.randomUUID()
  const { error: insertError } = await client
    .from('users')
    .insert({
      id: testId,
      email: 'schema_test@example.com',
      name: 'Schema Test',
      role: 'user',
      tenant_id: 'phaeton_ai'
    })
    .select()
  
  if (insertError) {
    console.log('Insert error:', insertError.message)
    console.log('Details:', insertError.details)
    console.log('Hint:', insertError.hint)
  } else {
    console.log('✅ Test insert successful - cleaning up...')
    await client.from('users').delete().eq('id', testId)
  }
}

checkSchema().catch(console.error)
