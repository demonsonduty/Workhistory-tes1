import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Define customer data interface
interface CustomerSummary {
  company_name: string;
  job_count: number;
  total_planned_hours: number;
  total_actual_hours: number;
  overrun_hours: number;
  planned_cost: number;
  actual_cost: number;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get yearly data
  app.get('/api/workhistory/summary/yearly', async (req, res) => {
    try {
      console.log('Fetching yearly summary data...');
      const yearlyData = await storage.getYearlySummary();
      console.log(`Yearly data fetched - ${yearlyData.length} years found:`);
      console.log(`Years available: ${yearlyData.map(y => y.year).join(', ')}`);
      
      if (yearlyData.length > 0) {
        const sampleYear = yearlyData[0];
        console.log('Sample year data:', {
          year: sampleYear.year,
          job_count: sampleYear.job_count,
          companies: sampleYear.companies ? sampleYear.companies.length : 'null'
        });
      }
      
      res.json(yearlyData);
    } catch (error) {
      console.error('Error fetching yearly data:', error);
      res.status(500).json({ error: 'Failed to fetch yearly data' });
    }
  });

  // Get raw data for debugging
  app.get('/api/workhistory/raw', async (req, res) => {
    try {
      const rawData = await storage.getRawData();
      console.log(`Raw data fetched - ${rawData.length} records found`);
      if (rawData.length > 0) {
        console.log('Sample raw record:', rawData[0]);
      }
      res.json(rawData);
    } catch (error) {
      console.error('Error fetching raw data:', error);
      res.status(500).json({ error: 'Failed to fetch raw data' });
    }
  });

  // Get year-specific data
  app.get('/api/workhistory/summary/year/:year', async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      if (isNaN(year)) {
        res.status(400).json({ error: 'Invalid year parameter' });
        return;
      }
      console.log(`Fetching data for year: ${year}`);
      const yearData = await storage.getYearData(year);
      console.log(`Found ${yearData.length} records for year ${year}`);
      res.json(yearData);
    } catch (error) {
      console.error('Error fetching year data:', error);
      res.status(500).json({ error: 'Failed to fetch year data' });
    }
  });

  // Get quarterly trends data
  app.get('/api/workhistory/trends/quarterly', async (req, res) => {
    try {
      console.log('Fetching quarterly trends data...');
      const quarterlyData = await storage.getQuarterlyTrends();
      console.log(`Quarterly data fetched - ${quarterlyData.length} records found`);
      
      if (quarterlyData.length > 0) {
        // Use Array.from to safely convert Set to Array
        const quarterSet = new Set(quarterlyData.map(q => q.label));
        const quarters = Array.from(quarterSet);
        console.log(`Quarters available: ${quarters.join(', ')}`);
        
        const sampleQuarter = quarterlyData[0];
        console.log('Sample quarter data:', {
          label: sampleQuarter.label,
          company: sampleQuarter.company_name,
          planned_cost: sampleQuarter.planned_cost,
          actual_cost: sampleQuarter.actual_cost
        });
      }
      
      res.json(quarterlyData);
    } catch (error) {
      console.error('Error fetching quarterly trends:', error);
      res.status(500).json({ error: 'Failed to fetch quarterly trends' });
    }
  });

  // Get full summary metrics
  app.get('/api/workhistory/summary/full', async (req, res) => {
    try {
      console.log('Fetching yearly summary...');
      const yearlyData = await storage.getYearlySummary();
      console.log(`Yearly data fetched: ${yearlyData.length} years found`);

      console.log('Fetching work center summary...');
      const workCenterData = await storage.getWorkCenterSummary();
      console.log(`Work center data fetched: ${workCenterData.length} work centers found`);

      // Also fetch customer data
      console.log('Fetching customer summary...');
      const customerData = await storage.getCustomerSummary() as CustomerSummary[];
      console.log(`Customer data fetched: ${customerData ? customerData.length : 0} customers found`);

      // Standard labor rate
      const LABOR_RATE = 199; // $199/hour

      // Calculate summary metrics
      const summary = {
        total_planned_hours: yearlyData.reduce((sum, year) => sum + Number(year.planned_hours || 0), 0),
        total_actual_hours: yearlyData.reduce((sum, year) => sum + Number(year.actual_hours || 0), 0),
        total_overrun_hours: 0, // Will calculate below
        total_ncr_hours: 0, // Not tracked in current schema
        total_planned_cost: 0, // Will calculate using standard rate
        total_actual_cost: 0, // Will calculate using standard rate
        total_jobs: yearlyData.reduce((sum, year) => sum + Number(year.job_count || 0), 0),
        total_operations: yearlyData.reduce((sum, year) => sum + Number(year.job_count || 0), 0), // Using job_count as proxy
        total_customers: 0, // Will be calculated from unique companies
        avg_profit_margin: 0, // Will calculate below
        most_profitable_customer: '',
        highest_overrun_customer: '',
        most_used_work_center: '',
        highest_overrun_work_center: ''
      };

      // Calculate overrun hours and costs
      summary.total_overrun_hours = summary.total_actual_hours - summary.total_planned_hours;
      summary.total_planned_cost = summary.total_planned_hours * LABOR_RATE;
      summary.total_actual_cost = summary.total_actual_hours * LABOR_RATE;

      // Calculate average profit margin
      if (summary.total_planned_cost > 0) {
        summary.avg_profit_margin = (summary.total_actual_cost - summary.total_planned_cost) / summary.total_planned_cost * 100;
      }

      // Count unique companies across all years
      const allCompanies = new Set<string>();
      yearlyData.forEach(year => {
        if (year.companies && Array.isArray(year.companies)) {
          year.companies.forEach(company => {
            if (company) allCompanies.add(company);
          });
        }
      });
      summary.total_customers = allCompanies.size;
      console.log(`Total unique customers found: ${summary.total_customers}`);

      // Process customer profitability data
      const customerMetrics: Record<string, { 
        jobs: number, 
        planned_hours: number, 
        actual_hours: number, 
        overrun_hours: number,
        planned_cost: number,
        actual_cost: number,
        profit_margin: number
      }> = {};

      // If we have customer data, process it
      if (customerData && customerData.length > 0) {
        customerData.forEach(customer => {
          const planned = Number(customer.total_planned_hours || 0);
          const actual = Number(customer.total_actual_hours || 0);
          const overrun = actual - planned;
          const plannedCost = Number(customer.planned_cost || planned * LABOR_RATE);
          const actualCost = Number(customer.actual_cost || actual * LABOR_RATE);
          const profitMargin = plannedCost > 0 ? ((actualCost - plannedCost) / plannedCost) * 100 : 0;
          
          customerMetrics[customer.company_name] = {
            jobs: Number(customer.job_count || 0),
            planned_hours: planned,
            actual_hours: actual,
            overrun_hours: overrun,
            planned_cost: plannedCost,
            actual_cost: actualCost,
            profit_margin: profitMargin
          };
        });
        
        // Find most profitable and highest overrun customers
        let mostProfitable = '';
        let highestOverrun = '';
        let bestMargin = 0;
        let worstMargin = 0;
        
        Object.entries(customerMetrics).forEach(([customer, metrics]) => {
          if (metrics.profit_margin < bestMargin) {
            bestMargin = metrics.profit_margin;
            mostProfitable = customer;
          }
          
          if (metrics.profit_margin > worstMargin) {
            worstMargin = metrics.profit_margin;
            highestOverrun = customer;
          }
        });
        
        summary.most_profitable_customer = mostProfitable;
        summary.highest_overrun_customer = highestOverrun;
      }

      // Process work center data
      const workCenterMetrics: Record<string, {
        total_hours: number,
        overrun_hours: number,
        utilization: number
      }> = {};

      // Transform work center data to match expected format
      const workcenterBreakdown = workCenterData.map(wc => {
        const workCenter = wc.work_center;
        const planned = Number(wc.total_planned_hours || 0);
        const actual = Number(wc.total_actual_hours || 0);
        const overrun = Number(wc.overrun_hours || 0);
        
        // Add to work center metrics
        if (!workCenterMetrics[workCenter]) {
          workCenterMetrics[workCenter] = {
            total_hours: actual,
            overrun_hours: overrun,
            utilization: planned > 0 ? (actual / planned) * 100 : 0
          };
        } else {
          workCenterMetrics[workCenter].total_hours += actual;
          workCenterMetrics[workCenter].overrun_hours += overrun;
        }
        
        return {
          work_center: workCenter,
          total_planned_hours: planned,
          total_actual_hours: actual,
          overrun_hours: overrun
        };
      });

      // Find most used and highest overrun work centers
      let maxHours = 0;
      let maxOverrun = 0;
      
      Object.entries(workCenterMetrics).forEach(([center, metrics]) => {
        if (metrics.total_hours > maxHours) {
          maxHours = metrics.total_hours;
          summary.most_used_work_center = center;
        }
        
        if (metrics.overrun_hours > maxOverrun) {
          maxOverrun = metrics.overrun_hours;
          summary.highest_overrun_work_center = center;
        }
      });

      // Return the full data
      res.json({
        summary,
        yearly_breakdown: yearlyData,
        workcenter_breakdown: workcenterBreakdown,
        customer_metrics: Object.entries(customerMetrics)
          .map(([customer, metrics]) => ({
            customer,
            ...metrics
          }))
          .sort((a, b) => b.actual_cost - a.actual_cost)
          .slice(0, 10), // Top 10 customers
        work_center_metrics: Object.entries(workCenterMetrics)
          .map(([center, metrics]) => ({
            work_center: center,
            ...metrics
          }))
          .sort((a, b) => b.total_hours - a.total_hours)
      });
    } catch (error: any) {
      console.error('Detailed error in full summary:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      res.status(500).json({ error: 'Failed to fetch full summary', details: error.message });
    }
  });

  // Import data from Excel
  app.post('/api/workhistory/import', async (req, res) => {
    try {
      const importedData = req.body;

      if (!importedData || !Array.isArray(importedData) || importedData.length === 0) {
        res.status(400).json({ error: 'Invalid data format' });
        return;
      }

      console.log('Sample record from import:', importedData[0]);

      // Process and standardize the data before saving
      const processedData = importedData.map(record => {
        // Parse date from 'Basic fin. date' field
        let date;
        try {
          // Try to extract the date from the 'Basic fin. date' field or fall back to 'date'
          date = record['Basic fin. date'] || record['date'] || new Date().toISOString();
          
          // Check if date is already a string in ISO format
          if (typeof date === 'string') {
            // If the date is in MM-DD-YYYY format (like 04-21-2015), convert to ISO
            if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
              const parts = date.split('-');
              const year = parts[2];
              const month = parts[0].padStart(2, '0');
              const day = parts[1].padStart(2, '0');
              date = `${year}-${month}-${day}T00:00:00.000Z`;
            } else {
              // Try to parse any other string format
              const parsedDate = new Date(date);
              if (!isNaN(parsedDate.getTime())) {
                date = parsedDate.toISOString();
              } else {
                console.error('Invalid date format:', date);
                date = new Date().toISOString();
              }
            }
          } else if (typeof date === 'number') {
            // Convert Excel date (number) to JS Date
            const excelEpoch = new Date(1899, 11, 30);
            const millisecondsPerDay = 24 * 60 * 60 * 1000;
            const newDate = new Date(excelEpoch.getTime() + (date * millisecondsPerDay));
            date = newDate.toISOString();
          } else {
            // Default to current date if all else fails
            date = new Date().toISOString();
          }
        } catch (e) {
          console.error('Error parsing date:', e);
          date = new Date().toISOString();
        }

        return {
          date: date,
          job_id: record.job_id || record['Sales Document'] || record['Order'] || record['job'] || '',
          part_id: record.part_id || record['Opr. short text'] || record['part'] || '',
          work_center: record.work_center || record['Oper.WorkCenter'] || record['work center'] || '',
          company_name: record.company_name || record['List name'] || record['name'] || record['customer'] || record['Customer'] || '',
          planned_hours: Number(record.planned_hours || record['Work'] || record['planned hours'] || 0),
          actual_hours: Number(record.actual_hours || record['Actual work'] || record['actual hours'] || 0),
          labor_rate: Number(record.labor_rate || record['Labor Rate'] || record['labor rate'] || 199) // Default to $199/hour if not specified
        };
      });

      await storage.saveWorkHistory(processedData);

      res.status(200).json({
        message: 'Data imported successfully',
        count: processedData.length
      });
    } catch (error) {
      console.error('Error importing data:', error);
      res.status(500).json({ error: 'Failed to import data' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}