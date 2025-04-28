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
      // Query to get date range
      const dateRangeQuery = `
        SELECT 
          MIN(date) as min_date, 
          MAX(date) as max_date
        FROM work_history
      `;
      
      // Query to get years present in the database
      const yearsQuery = `
        SELECT DISTINCT EXTRACT(YEAR FROM date)::text as year
        FROM work_history
        WHERE date IS NOT NULL
        ORDER BY year
      `;
      
      // Query to get row count
      const rowCountQuery = `SELECT COUNT(*) as count FROM work_history`;
      
      // Query to get totals for planned vs actual hours
      const hoursQuery = `
        SELECT 
          SUM(planned_hours) as planned,
          SUM(actual_hours) as actual
        FROM work_history
      `;
      
      // Query to get sample rows for analysis
      const sampleRowsQuery = `
        SELECT *
        FROM work_history
        LIMIT 5
      `;
      
      // Execute all queries in parallel for better performance
      const [dateRangeResult, yearsResult, rowCountResult, hoursResult, sampleRowsResult] = await Promise.all([
        client.query(dateRangeQuery),
        client.query(yearsQuery),
        client.query(rowCountQuery),
        client.query(hoursQuery),
        client.query(sampleRowsQuery)
      ]);
      
      // Combine all results
      const dateRange = dateRangeResult.rows[0] ? {
        min: dateRangeResult.rows[0].min_date,
        max: dateRangeResult.rows[0].max_date
      } : null;
      
      const years = yearsResult.rows.map(row => row.year);
      const rowCount = rowCountResult.rows[0]?.count || 0;
      
      const hours = hoursResult.rows[0] ? {
        planned: parseFloat(hoursResult.rows[0].planned) || 0,
        actual: parseFloat(hoursResult.rows[0].actual) || 0
      } : null;
      
      // Prepare message for possible data issues
      let message = null;
      
      // Check if all dates are in 2025
      if (years.length === 1 && years[0] === '2025') {
        message = "WARNING: All dates are in 2025. This suggests the Excel date import may have been incorrect. Try reimporting with fixed date parsing.";
      }
      
      // Check if dates are suspiciously old (before 2000)
      if (dateRange && dateRange.min) {
        const minYear = new Date(dateRange.min).getFullYear();
        if (minYear < 2000) {
          message = `WARNING: Some dates are very old (${minYear}). This suggests date parsing errors during import.`;
        }
      }
      
      // Check if there are rows with 0 planned AND 0 actual hours
      if (hours && (hours.planned === 0 || hours.actual === 0)) {
        message = "WARNING: Some rows have 0 for both planned and actual hours. This may affect calculations.";
      }
      
      const result = {
        dateRange,
        years,
        rowCount: parseInt(rowCount),
        hours,
        sampleRows: sampleRowsResult.rows,
        message
      };
      
      return NextResponse.json(result);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 