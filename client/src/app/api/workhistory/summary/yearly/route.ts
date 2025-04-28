// Use dynamic import for NextResponse to avoid the missing module error
import type { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a database connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL
});

export async function GET() {
  const { NextResponse } = await import('next/server');
  
  try {
    const client = await pool.connect();
    
    try {
      // Fetch yearly summary data
      const result = await client.query(`
        WITH yearly_data AS (
          SELECT 
            EXTRACT(YEAR FROM date)::text as year,
            SUM(planned_hours) as planned_hours,
            SUM(actual_hours) as actual_hours,
            COUNT(DISTINCT part_id) as unique_parts,
            SUM(planned_hours * labor_rate) as planned_cost,
            SUM(actual_hours * labor_rate) as actual_cost,
            COUNT(DISTINCT job_id) as job_count,
            array_agg(DISTINCT company_name ORDER BY company_name) as companies
          FROM work_history
          WHERE date IS NOT NULL 
          GROUP BY EXTRACT(YEAR FROM date)
        )
        SELECT 
          year,
          ROUND(planned_hours::numeric, 2) as planned_hours,
          ROUND(actual_hours::numeric, 2) as actual_hours,
          unique_parts,
          ROUND(planned_cost::numeric, 2) as planned_cost,
          ROUND(actual_cost::numeric, 2) as actual_cost,
          job_count,
          companies
        FROM yearly_data
        ORDER BY year ASC;
      `);
      
      console.log(`Yearly summary found ${result.rows.length} years of data`);
      
      // Return the structured data
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch yearly summary data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 