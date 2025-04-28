import { Pool } from 'pg';
import { WorkHistory, YearlySummary } from '../shared/schema';

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL
});

export const storage = {
  async saveWorkHistory(data: WorkHistory[]) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const record of data) {
        await client.query(
          `INSERT INTO work_history (date, job_id, part_id, work_center, company_name, planned_hours, actual_hours, labor_rate) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [record.date, record.job_id, record.part_id, record.work_center, record.company_name, record.planned_hours, record.actual_hours, record.labor_rate]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Database error:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  async getRawData() {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          date,
          job_id,
          part_id,
          work_center,
          company_name,
          planned_hours,
          actual_hours,
          labor_rate,
          EXTRACT(YEAR FROM date)::text as year
        FROM work_history
        ORDER BY date DESC
        LIMIT 100;
      `);
      
      // Log some debug info
      if (result.rows.length > 0) {
        const yearsSet = new Set(result.rows.map(r => r.year));
        const years = Array.from(yearsSet).sort();
        console.log(`Years in raw data: ${years.join(', ')}`);
        console.log(`Sample date value: ${result.rows[0].date}`);
      }
      
      return result.rows;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  async getYearlySummary(): Promise<YearlySummary[]> {
    const client = await pool.connect();
    try {
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
      
      // Log the years found to help diagnose the issue
      if (result.rows.length > 0) {
        console.log(`Years found in database: ${result.rows.map(r => r.year).join(', ')}`);
      } else {
        console.log('No yearly data found in the database');
      }
      
      return result.rows;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  async getWorkCenterSummary() {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          work_center,
          company_name,
          SUM(planned_hours) as total_planned_hours,
          SUM(actual_hours) as total_actual_hours,
          SUM(actual_hours - planned_hours) as overrun_hours,
          SUM((actual_hours - planned_hours) * labor_rate) as overrun_cost
        FROM work_history
        WHERE work_center IS NOT NULL AND work_center != ''
        GROUP BY work_center, company_name
        ORDER BY company_name ASC, work_center ASC;
      `);
      return result.rows;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  async getCustomerSummary() {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          company_name,
          COUNT(DISTINCT job_id) as job_count,
          SUM(planned_hours) as total_planned_hours,
          SUM(actual_hours) as total_actual_hours,
          SUM(actual_hours - planned_hours) as overrun_hours,
          SUM(planned_hours * labor_rate) as planned_cost,
          SUM(actual_hours * labor_rate) as actual_cost
        FROM work_history
        WHERE company_name IS NOT NULL AND company_name != ''
        GROUP BY company_name
        ORDER BY SUM(actual_hours) DESC;
      `);
      return result.rows;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  async getQuarterlyTrends() {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        WITH quarterly_data AS (
          SELECT 
            date_trunc('quarter', date) as quarter_start,
            EXTRACT(YEAR FROM date) as year,
            EXTRACT(QUARTER FROM date) as quarter,
            company_name,
            SUM(planned_hours * labor_rate) as planned_cost,
            SUM(actual_hours * labor_rate) as actual_cost,
            COUNT(DISTINCT job_id) as job_count
          FROM work_history
          WHERE date IS NOT NULL
          GROUP BY 
            date_trunc('quarter', date),
            EXTRACT(YEAR FROM date),
            EXTRACT(QUARTER FROM date),
            company_name
        )
        SELECT 
          CONCAT('Q', quarter::integer, ' ', year::integer) as label,
          company_name,
          round(planned_cost::numeric, 2) as planned_cost,
          round(actual_cost::numeric, 2) as actual_cost,
          round(((actual_cost - planned_cost) / NULLIF(planned_cost, 0) * 100)::numeric, 1) as overrun_percentage,
          job_count
        FROM quarterly_data
        ORDER BY year ASC, quarter ASC, company_name ASC;
      `);
      return result.rows;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  async getYearData(year: number) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          date,
          job_id,
          part_id,
          work_center,
          company_name,
          planned_hours,
          actual_hours,
          labor_rate,
          actual_hours * labor_rate as actual_cost,
          planned_hours * labor_rate as planned_cost
        FROM work_history
        WHERE EXTRACT(YEAR FROM date) = $1
        ORDER BY date ASC, company_name ASC;
      `, [year]);
      return result.rows;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
};