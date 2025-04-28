// Use dynamic import for NextResponse to avoid the missing module error
import type { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a database connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL
});

export async function GET(
  request: Request,
  { params }: { params: { year: string } }
) {
  const { NextResponse } = await import('next/server');
  const year = params.year;
  
  if (!year) {
    return NextResponse.json(
      { error: 'Year parameter is required' },
      { status: 400 }
    );
  }

  try {
    const client = await pool.connect();
    
    try {
      // Get summary metrics for the year
      const summaryQuery = `
        SELECT 
          SUM(planned_hours) as total_planned_hours,
          SUM(actual_hours) as total_actual_hours,
          SUM(CASE WHEN actual_hours > planned_hours THEN actual_hours - planned_hours ELSE 0 END) as total_overrun_hours,
          SUM(CASE WHEN actual_hours > planned_hours THEN (actual_hours - planned_hours) * labor_rate ELSE 0 END) as opportunity_cost_dollars,
          COUNT(DISTINCT job_id) as total_jobs,
          COUNT(*) as total_operations,
          COUNT(DISTINCT part_id) as total_unique_parts,
          COUNT(DISTINCT company_name) as total_customers
        FROM work_history
        WHERE EXTRACT(YEAR FROM date) = $1
      `;

      // Get quarterly breakdown
      const quarterlyQuery = `
        SELECT 
          EXTRACT(QUARTER FROM date)::integer as quarter,
          SUM(planned_hours) as planned_hours,
          SUM(actual_hours) as actual_hours,
          SUM(CASE WHEN actual_hours > planned_hours THEN actual_hours - planned_hours ELSE 0 END) as overrun_hours,
          SUM(CASE WHEN actual_hours > planned_hours THEN (actual_hours - planned_hours) * labor_rate ELSE 0 END) as overrun_cost,
          COUNT(DISTINCT job_id) as total_jobs
        FROM work_history
        WHERE EXTRACT(YEAR FROM date) = $1
        GROUP BY EXTRACT(QUARTER FROM date)
        ORDER BY quarter
      `;
      
      // Get top overrun jobs
      const topOverrunsQuery = `
        SELECT 
          job_id as job_number,
          part_name,
          work_center,
          task_description,
          planned_hours,
          actual_hours,
          (actual_hours - planned_hours) as overrun_hours,
          (actual_hours - planned_hours) * labor_rate as overrun_cost
        FROM work_history
        WHERE 
          EXTRACT(YEAR FROM date) = $1 AND
          actual_hours > planned_hours
        ORDER BY (actual_hours - planned_hours) DESC
        LIMIT 20
      `;
      
      // Get workcenter performance
      const workcenterQuery = `
        SELECT 
          work_center,
          COUNT(DISTINCT job_id) as job_count,
          SUM(planned_hours) as planned_hours,
          SUM(actual_hours) as actual_hours,
          SUM(CASE WHEN actual_hours > planned_hours THEN actual_hours - planned_hours ELSE 0 END) as overrun_hours,
          SUM(CASE WHEN actual_hours > planned_hours THEN (actual_hours - planned_hours) * labor_rate ELSE 0 END) as overrun_cost
        FROM work_history
        WHERE EXTRACT(YEAR FROM date) = $1
        GROUP BY work_center
        ORDER BY overrun_cost DESC
      `;
      
      // Get NCR failures
      const ncrQuery = `
        SELECT 
          job_id as job_number,
          part_name,
          work_center,
          notes as failure_reason,
          planned_hours,
          actual_hours,
          (actual_hours - planned_hours) as overrun_hours,
          (actual_hours - planned_hours) * labor_rate as overrun_cost
        FROM work_history
        WHERE 
          EXTRACT(YEAR FROM date) = $1 AND
          notes IS NOT NULL AND
          notes != ''
        ORDER BY (actual_hours - planned_hours) DESC
        LIMIT 20
      `;
      
      // Get repeat NCR failures
      const repeatNcrQuery = `
        SELECT 
          part_name,
          COUNT(DISTINCT job_id) as job_count,
          SUM(planned_hours) as planned_hours,
          SUM(actual_hours) as actual_hours,
          SUM(CASE WHEN actual_hours > planned_hours THEN actual_hours - planned_hours ELSE 0 END) as overrun_hours,
          SUM(CASE WHEN actual_hours > planned_hours THEN (actual_hours - planned_hours) * labor_rate ELSE 0 END) as overrun_cost
        FROM work_history
        WHERE 
          EXTRACT(YEAR FROM date) = $1 AND
          notes IS NOT NULL AND
          notes != ''
        GROUP BY part_name
        HAVING COUNT(DISTINCT job_id) > 1
        ORDER BY overrun_cost DESC
        LIMIT 20
      `;
      
      try {
        // Execute all queries in parallel
        const [
          summaryResult, 
          quarterlyResult, 
          topOverrunsResult, 
          workcenterResult, 
          ncrResult, 
          repeatNcrResult
        ] = await Promise.all([
          client.query(summaryQuery, [year]),
          client.query(quarterlyQuery, [year]),
          client.query(topOverrunsQuery, [year]),
          client.query(workcenterQuery, [year]),
          client.query(ncrQuery, [year]),
          client.query(repeatNcrQuery, [year])
        ]);
        
        // Log the results for debugging
        console.log(`Found ${topOverrunsResult.rows.length} records for year ${year}`);

        // Combine all results in the expected structure
        return NextResponse.json({
          summary: summaryResult.rows[0] || {
            total_planned_hours: 0,
            total_actual_hours: 0,
            total_overrun_hours: 0,
            opportunity_cost_dollars: 0,
            total_jobs: 0,
            total_operations: 0,
            total_unique_parts: 0,
            total_customers: 0
          },
          quarterly_summary: quarterlyResult.rows || [],
          top_overruns: topOverrunsResult.rows || [],
          workcenter_summary: workcenterResult.rows || [],
          ncr_summary: ncrResult.rows || [],
          repeat_ncr_failures: repeatNcrResult.rows || []
        });
      } catch (queryError) {
        console.error('Query error:', queryError);
        
        // Try a fallback approach if the structured queries fail
        // Get all work history data for the year
        const fallbackQuery = `
          SELECT * FROM work_history
          WHERE EXTRACT(YEAR FROM date) = $1
        `;
        
        const fallbackResult = await client.query(fallbackQuery, [year]);
        console.log(`Fetching data for year: ${year}`);
        console.log(`Found ${fallbackResult.rowCount} records for year ${year}`);
        
        // Return empty result with the expected structure
        return NextResponse.json({
          summary: {
            total_planned_hours: 0,
            total_actual_hours: 0,
            total_overrun_hours: 0,
            opportunity_cost_dollars: 0,
            total_jobs: 0,
            total_operations: 0,
            total_unique_parts: 0,
            total_customers: 0
          },
          quarterly_summary: [],
          top_overruns: [],
          workcenter_summary: [],
          ncr_summary: [],
          repeat_ncr_failures: []
        });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch year data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 