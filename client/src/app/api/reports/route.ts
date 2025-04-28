import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || 'all';
  const quarter = searchParams.get('quarter') || 'all';
  
  console.log(`Reports API: Processing request for year=${year}, quarter=${quarter}`);
  
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Generate the date filter clause based on parameters
    let dateFilter = '';
    let dateFilterParams = [];
    let paramIndex = 1;
    
    if (year !== 'all') {
      dateFilter += `EXTRACT(YEAR FROM date) = $${paramIndex}`;
      dateFilterParams.push(year);
      paramIndex++;
    }
    
    if (quarter !== 'all' && quarter !== '0') {
      if (dateFilter) dateFilter += ' AND ';
      dateFilter += `EXTRACT(QUARTER FROM date) = $${paramIndex}`;
      dateFilterParams.push(quarter);
    }
    
    if (dateFilter) {
      dateFilter = 'WHERE ' + dateFilter;
    }

    // Get available years for metadata
    const yearQuery = `
      SELECT DISTINCT EXTRACT(YEAR FROM date)::INTEGER as year 
      FROM work_history 
      ORDER BY year
    `;
    
    const yearResult = await pool.query(yearQuery);
    const availableYears = yearResult.rows.map(row => row.year);

    // Query 1: Top Jobs by Hours
    let overrunsQuery = `
      SELECT 
        job_number, 
        work_center, 
        part_name, 
        SUM(planned_hours) as planned_hours, 
        SUM(actual_hours) as actual_hours
      FROM work_history
      ${dateFilter}
      GROUP BY job_number, work_center, part_name
      ORDER BY SUM(actual_hours) DESC
      LIMIT 10
    `;

    // Query 2: Job Performance Metrics
    let ncrFailuresQuery = `
      SELECT 
        job_number, 
        part_name, 
        work_center, 
        SUM(planned_hours) as planned_hours, 
        SUM(actual_hours) as actual_hours,
        CASE 
          WHEN SUM(planned_hours) > 0 
          THEN ROUND((SUM(actual_hours) / SUM(planned_hours) * 100)::numeric, 1) 
          ELSE 0 
        END as efficiency_percent
      FROM work_history
      ${dateFilter}
      GROUP BY job_number, part_name, work_center
      ORDER BY 
        CASE 
          WHEN SUM(planned_hours) > 0 
          THEN ABS(SUM(actual_hours) - SUM(planned_hours)) / SUM(planned_hours)
          ELSE 0
        END DESC
      LIMIT 10
    `;

    // Query 3: Workcenter Performance
    let workcenterQuery = `
      SELECT 
        work_center, 
        COUNT(DISTINCT job_number) as job_count, 
        SUM(planned_hours) as planned_hours, 
        SUM(actual_hours) as actual_hours,
        CASE 
          WHEN SUM(planned_hours) > 0 
          THEN ROUND((SUM(actual_hours) / SUM(planned_hours) * 100)::numeric, 1) 
          ELSE 0 
        END as efficiency_percent
      FROM work_history
      ${dateFilter}
      GROUP BY work_center
      ORDER BY job_count DESC
    `;

    // Query 4: Multi-Job Parts
    let repeatOffendersQuery = `
      SELECT 
        part_name, 
        COUNT(DISTINCT job_number) as job_count, 
        SUM(planned_hours) as planned_hours, 
        SUM(actual_hours) as actual_hours,
        CASE 
          WHEN SUM(planned_hours) > 0 
          THEN ROUND((SUM(actual_hours) / SUM(planned_hours) * 100)::numeric, 1) 
          ELSE 0 
        END as overrun_percent
      FROM work_history
      ${dateFilter}
      GROUP BY part_name
      HAVING COUNT(DISTINCT job_number) > 1
      ORDER BY job_count DESC
      LIMIT 10
    `;

    // Query 5: Parts Metrics
    let jobAdjustmentsQuery = `
      SELECT 
        part_name, 
        SUM(planned_hours) as total_planned, 
        SUM(actual_hours) as total_actual
      FROM work_history
      ${dateFilter}
      GROUP BY part_name
      ORDER BY SUM(planned_hours) DESC
      LIMIT 10
    `;

    // Execute all queries in parallel
    const [overrunsResult, ncrResult, workcenterResult, repeatOffendersResult, jobAdjustmentsResult] = 
      await Promise.all([
        pool.query(overrunsQuery, dateFilterParams),
        pool.query(ncrFailuresQuery, dateFilterParams),
        pool.query(workcenterQuery, dateFilterParams),
        pool.query(repeatOffendersQuery, dateFilterParams),
        pool.query(jobAdjustmentsQuery, dateFilterParams)
      ]);

    return NextResponse.json({
      metadata: {
        selectedYear: year,
        selectedQuarter: quarter,
        availableYears
      },
      topOverruns: overrunsResult.rows,
      ncrFailures: ncrResult.rows,
      workcenterPerformance: workcenterResult.rows,
      repeatOffenders: repeatOffendersResult.rows,
      jobAdjustments: jobAdjustmentsResult.rows
    });
  } catch (error) {
    console.error('Error fetching report data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report data', details: (error as Error).message },
      { status: 500 }
    );
  }
} 