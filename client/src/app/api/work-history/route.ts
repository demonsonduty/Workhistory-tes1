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
      // Fetch work history with a reasonable limit to prevent huge responses
      const result = await client.query(`
        SELECT 
          date, 
          job_id, 
          part_id, 
          work_center, 
          company_name, 
          planned_hours, 
          actual_hours, 
          labor_rate
        FROM work_history
        ORDER BY date DESC
        LIMIT 1000
      `);
      
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work history data' },
      { status: 500 }
    );
  }
} 