import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a database connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL
});

export async function GET() {
  try {
    const client = await pool.connect();
    
    try {
      // Simple query just to count records with overruns
      const overrunsQuery = `
        SELECT 
          COUNT(*) as total_rows,
          COUNT(CASE WHEN actual_hours > planned_hours THEN 1 END) as overrun_count,
          COUNT(DISTINCT job_id) as job_count,
          COUNT(DISTINCT work_center) as work_center_count,
          COUNT(DISTINCT part_id) as part_count
        FROM work_history
      `;
      
      // Get details about the work_history table
      const tableInfoQuery = `
        SELECT 
          column_name, 
          data_type 
        FROM information_schema.columns 
        WHERE table_name = 'work_history'
      `;
      
      // Execute queries
      const [overrunsResult, tableInfoResult] = await Promise.all([
        client.query(overrunsQuery),
        client.query(tableInfoQuery)
      ]);
      
      // Get a few sample rows to examine
      const sampleRowsQuery = `
        SELECT * FROM work_history LIMIT 3
      `;
      const sampleRowsResult = await client.query(sampleRowsQuery);
      
      // Check if we have overruns at all
      const hasOverruns = parseInt(overrunsResult.rows[0].overrun_count) > 0;
      
      // Build the response with diagnostic info
      const diagnosticInfo = {
        // Basic counts
        totalRows: parseInt(overrunsResult.rows[0].total_rows),
        overrunCount: parseInt(overrunsResult.rows[0].overrun_count),
        jobCount: parseInt(overrunsResult.rows[0].job_count),
        workCenterCount: parseInt(overrunsResult.rows[0].work_center_count),
        partCount: parseInt(overrunsResult.rows[0].part_count),
        
        // Table structure info
        tableColumns: tableInfoResult.rows,
        
        // Sample data for inspection
        sampleRows: sampleRowsResult.rows,
        
        // Diagnostics
        hasOverruns,
        databaseConnected: true,
        message: hasOverruns 
          ? `Database has ${overrunsResult.rows[0].overrun_count} rows with overruns` 
          : "No overruns found in the database. This is why dashboard sections aren't loading."
      };
      
      return NextResponse.json(diagnosticInfo);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({
      error: 'Failed to fetch diagnostic data',
      details: error instanceof Error ? error.message : String(error),
      databaseConnected: false
    }, { status: 500 });
  }
} 