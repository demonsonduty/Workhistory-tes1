import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import DetailedTabs from '@/components/DetailedTabs';
import SummaryMetrics from '@/components/SummaryMetrics';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, formatMoney } from '@/lib/formatters';
import { useEffect, useState, useMemo, Suspense, lazy } from 'react';

// Define types for the API response data
interface YearSummary {
  total_planned_hours?: number;
  total_actual_hours?: number;
  total_overrun_hours?: number;
  ghost_hours?: number;
  total_ncr_hours?: number;
  total_planned_cost?: number;
  total_actual_cost?: number;
  opportunity_cost_dollars?: number;
}

interface QuarterlySummary {
  quarter: number;
  planned_hours: number;
  actual_hours: number;
  overrun_hours: number;
  overrun_cost: number;
  total_jobs: number;
}

interface OverrunJob {
  job_number: string;
  part_name: string;
  work_center: string;
  task_description: string;
  planned_hours: number;
  actual_hours: number;
  overrun_hours: number;
  overrun_cost: number;
}

interface WorkcenterSummary {
  work_center: string;
  job_count: number;
  planned_hours: number;
  actual_hours: number;
  overrun_hours: number;
  overrun_cost: number;
}

interface NCRSummary {
  job_number: string;
  part_name: string;
  work_center: string;
  failure_reason: string;
  planned_hours: number;
  actual_hours: number;
  overrun_hours: number;
  overrun_cost: number;
}

interface RepeatNCRFailure {
  part_name: string;
  job_count: number;
  planned_hours: number;
  actual_hours: number;
  overrun_hours: number;
  overrun_cost: number;
}

interface YearData {
  summary: YearSummary;
  quarterly_summary: QuarterlySummary[];
  top_overruns: OverrunJob[];
  workcenter_summary: WorkcenterSummary[];
  ncr_summary: NCRSummary[];
  repeat_ncr_failures: RepeatNCRFailure[];
}

// Raw data interface
interface WorkHistoryRecord {
  date: string;
  job_id: string;
  job_number: string;
  part_id: string;
  part_name: string;
  work_center: string;
  oper_work_center?: string;
  oper_short_text?: string;
  company_name: string;
  task_description?: string;
  planned_hours: number;
  actual_hours: number;
  labor_rate: number;
  notes?: string;
}

// Lazy load the tabs component to improve initial loading
const LazyDetailedTabs = lazy(() => import('@/components/DetailedTabs'));

export default function YearView() {
  // Extract year from route
  const [match, params] = useRoute('/workhistory/year/:year');
  const year = params?.year || '';
  const [processedData, setProcessedData] = useState<YearData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  console.log("YearView - Fetching data for year:", year);

  // Use the original API endpoint
  const { data, isLoading, error } = useQuery<WorkHistoryRecord[]>({
    queryKey: [`/api/workhistory/summary/year/${year}`],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Process raw data into structured format when it's available
  useEffect(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      console.log(`Processing ${data.length} raw records for year ${year}`);
      
      // First create and update just the summary data for quick display
      try {
        const summaryData = createSummaryData(data);
        setProcessedData({
          summary: summaryData,
          quarterly_summary: [],
          top_overruns: [],
          workcenter_summary: [],
          ncr_summary: [],
          repeat_ncr_failures: []
        });
      } catch (err) {
        console.error("Error creating summary data:", err);
      }

      // Then process the full data if details are requested
      if (showDetails) {
        setIsProcessing(true);
        
        // Use setTimeout to prevent UI blocking during processing
        setTimeout(() => {
          try {
      const structuredData = processRawData(data);
      setProcessedData(structuredData);
          } catch (err) {
            console.error("Error processing detailed data:", err);
          } finally {
            setIsProcessing(false);
          }
        }, 0);
      }
    } else if (error) {
      console.error("Error fetching data:", error);
    }
  }, [data, year, showDetails]);

  // Create just the summary metrics from raw data - fast calculation
  const createSummaryData = (rawData: WorkHistoryRecord[]): YearSummary => {
    console.log("Creating summary data from", rawData.length, "records");
    
    const summaryData: YearSummary = {
      total_planned_hours: 0,
      total_actual_hours: 0,
      total_overrun_hours: 0,
      ghost_hours: 0,
      total_ncr_hours: 0,
      total_planned_cost: 0,
      total_actual_cost: 0,
      opportunity_cost_dollars: 0
    };
    
    // Log the first record to check data structure
    if (rawData.length > 0) {
      console.log("First record data types:", {
        planned_hours_type: typeof rawData[0].planned_hours,
        actual_hours_type: typeof rawData[0].actual_hours,
        labor_rate_type: typeof rawData[0].labor_rate,
        oper_short_text: rawData[0].oper_short_text
      });
    }
    
    // More flexible NCR detection function - try to match their data format
    const isNcrRecord = (record: WorkHistoryRecord): boolean => {
      // Check all text fields for any indication of NCR
      const checkField = (field: string | undefined): boolean => {
        if (!field) return false;
        const fieldUpper = field.toUpperCase();
        return fieldUpper.includes('NCR') || 
               fieldUpper.includes('NON-CONFORMANCE') || 
               fieldUpper.includes('NONCONFORMANCE') ||
               fieldUpper.includes('QUALITY ISSUE');
      };
      
      return checkField(record.notes) || 
             checkField(record.oper_short_text) || 
             checkField(record.task_description) || 
             checkField(record.part_name) || 
             checkField(record.job_number) ||
             checkField(record.work_center);
    };
    
    // Count NCR records for debugging
    let ncrCount = 0;

    // Quick single pass for summary data
    for (const record of rawData) {
      // Convert string values to numbers
      const plannedHours = parseFloat(String(record.planned_hours)) || 0;
      const actualHours = parseFloat(String(record.actual_hours)) || 0;
      const laborRate = parseFloat(String(record.labor_rate)) || 0;
      
      summaryData.total_planned_hours! += plannedHours;
      summaryData.total_actual_hours! += actualHours;
      
      if (actualHours > plannedHours) {
        summaryData.total_overrun_hours! += (actualHours - plannedHours);
        summaryData.opportunity_cost_dollars! += (actualHours - plannedHours) * laborRate;
      }
      
      if (plannedHours > 0 && actualHours === 0) {
        summaryData.ghost_hours! += plannedHours;
      }
      
      // Check if this is an NCR record using improved detection
      if (isNcrRecord(record)) {
        summaryData.total_ncr_hours! += actualHours;
        ncrCount++;
      }
      
      summaryData.total_planned_cost! += (plannedHours * laborRate);
      summaryData.total_actual_cost! += (actualHours * laborRate);
    }
    
    // Log the summary data to verify calculations
    console.log("Calculated summary:", {
      total_planned_hours: summaryData.total_planned_hours,
      total_actual_hours: summaryData.total_actual_hours,
      total_overrun_hours: summaryData.total_overrun_hours,
      total_ncr_hours: summaryData.total_ncr_hours,
      ncr_record_count: ncrCount
    });
    
    return summaryData;
  };

  // Process raw data into the format that the components expect
  const processRawData = (rawData: WorkHistoryRecord[]): YearData => {
    console.log("Full data processing started for", rawData.length, "records");
    
    // Log a sample record to debug
    if (rawData.length > 0) {
      console.log("Sample record:", JSON.stringify(rawData[0], null, 2));
    }
    
    // Use the previously calculated summary
    const summaryData = createSummaryData(rawData);
    
    // Create maps for aggregating data
    const quarterlyData: Map<number, QuarterlySummary> = new Map();
    const workCenterMap: Map<string, WorkcenterSummary> = new Map();
    const partFailureMap: Map<string, RepeatNCRFailure> = new Map();
    const overrunJobs: OverrunJob[] = [];
    const ncrFailures: NCRSummary[] = [];
    
    // Filter out records with 'Grand Total' as work center
    const filteredData = rawData.filter(record => 
      (record.oper_work_center || record.work_center) && 
      (record.oper_work_center || record.work_center).trim() !== 'Grand Total' && 
      (record.oper_work_center || record.work_center).trim() !== ''
    );
    
    console.log(`Filtered out ${rawData.length - filteredData.length} records with invalid work centers`);
    
    // Enhanced function to check if a record is an NCR record - try all possible indicators
    const isNcrRecord = (record: WorkHistoryRecord): boolean => {
      // Check all text fields for any indication of NCR
      const checkField = (field: string | undefined): boolean => {
        if (!field) return false;
        const fieldUpper = field.toUpperCase();
        return fieldUpper.includes('NCR') || 
               fieldUpper.includes('NON-CONFORMANCE') || 
               fieldUpper.includes('NONCONFORMANCE') ||
               fieldUpper.includes('QUALITY ISSUE');
      };
      
      return checkField(record.notes) || 
             checkField(record.oper_short_text) || 
             checkField(record.task_description) || 
             checkField(record.part_name) || 
             checkField(record.job_number) ||
             checkField(record.work_center);
    };
    
    // Count how many NCR records we have
    const ncrRecords = filteredData.filter(record => isNcrRecord(record));
    console.log(`Found ${ncrRecords.length} NCR records out of ${filteredData.length} total records`);
    
    // Helper function to ensure all fields are valid strings to prevent null/undefined errors
    const ensureValidStrings = (obj: any): any => {
      const result = { ...obj };
      // Convert any undefined or null values to empty strings for string fields
      Object.keys(result).forEach(key => {
        if (typeof result[key] === 'undefined' || result[key] === null) {
          // If it's expected to be a string field, set to empty string
          if (key === 'job_number' || key === 'part_name' || key === 'work_center' || 
              key === 'task_description' || key === 'failure_reason') {
            result[key] = '';
          }
        }
      });
      return result;
    };
    
    // Log the first few NCR records to see what they look like
    if (ncrRecords.length > 0) {
      console.log("Sample NCR records:", ncrRecords.slice(0, 3).map(r => ({
        job_number: r.job_number || '',
        part_name: r.part_name || '',
        oper_short_text: r.oper_short_text || '',
        task_description: r.task_description || '',
        notes: r.notes || '',
        work_center: r.work_center || '',
        oper_work_center: r.oper_work_center || ''
      })));
    } else {
      // If we didn't find any NCR records using our criteria, create some dummy records for testing
      console.log("No NCR records found with criteria. Generating dummy NCR data for testing...");
      // Take the first 3 records and treat them as NCR records for testing
      if (filteredData.length > 0) {
        for (let i = 0; i < Math.min(5, filteredData.length); i++) {
          const record = filteredData[i];
          const plannedHours = parseFloat(String(record.planned_hours)) || 0;
          const actualHours = parseFloat(String(record.actual_hours)) || 0;
          const laborRate = parseFloat(String(record.labor_rate)) || 0;
          const workCenter = record.oper_work_center || record.work_center || '';
          
          ncrFailures.push({
            job_number: (record.job_number || '') + " (TEST NCR)",
            part_name: record.part_name || 'Unknown Part',
            work_center: workCenter,
            failure_reason: "TEST NCR - Debugging data display",
            planned_hours: plannedHours,
            actual_hours: actualHours,
            overrun_hours: Math.max(0, actualHours - plannedHours),
            overrun_cost: Math.max(0, actualHours - plannedHours) * laborRate
          });
        }
        console.log("Created dummy NCR records for testing:", ncrFailures.length);
      }
    }
    
    // Single pass through filteredData to gather all information
    for (const record of filteredData) {
      // Convert string values to numbers
      const plannedHours = parseFloat(String(record.planned_hours)) || 0;
      const actualHours = parseFloat(String(record.actual_hours)) || 0;
      const laborRate = parseFloat(String(record.labor_rate)) || 0;
      
      // Get the work center (prefer oper_work_center if available)
      const workCenter = record.oper_work_center || record.work_center || '';
      
      const isOverrun = actualHours > plannedHours;
      const overrunHours = isOverrun ? (actualHours - plannedHours) : 0;
      const overrunCost = overrunHours * laborRate;
      
      if (isOverrun) {
        // Add to overrun jobs if significant
        overrunJobs.push({
          job_number: record.job_number || '',
          part_name: record.part_name || '',
          work_center: workCenter,
          task_description: record.task_description || '',
          planned_hours: plannedHours,
          actual_hours: actualHours,
          overrun_hours: overrunHours,
          overrun_cost: overrunCost
        });
      }
      
      // Check if this is an NCR record using our enhanced helper function
      if (isNcrRecord(record) && ncrFailures.length < 100) { // Limit to avoid overwhelming UI
        // Add to NCR failures if we don't have dummy data
        if (ncrRecords.length > 0) {
          ncrFailures.push({
            job_number: record.job_number || '',
            part_name: record.part_name || '',
            work_center: workCenter,
            failure_reason: record.oper_short_text || record.task_description || record.notes || 'NCR',
            planned_hours: plannedHours,
            actual_hours: actualHours,
            overrun_hours: overrunHours,
            overrun_cost: overrunCost
          });
        }
        
        // Update part failure map
        // Use a valid part name or default to "Unknown Part"
        const partName = record.part_name || 'Unknown Part';
        
        if (!partFailureMap.has(partName)) {
          partFailureMap.set(partName, {
            part_name: partName,
            job_count: 0,
            planned_hours: 0,
            actual_hours: 0,
            overrun_hours: 0,
            overrun_cost: 0
          });
        }
        
        const partData = partFailureMap.get(partName)!;
        partData.planned_hours += plannedHours;
        partData.actual_hours += actualHours;
        partData.overrun_hours += overrunHours;
        partData.overrun_cost += overrunCost;
      }
      
      // Quarterly data
      const date = new Date(record.date);
      const quarter = Math.floor((date.getMonth() / 3) + 1);
      
      if (!quarterlyData.has(quarter)) {
        quarterlyData.set(quarter, {
          quarter,
          planned_hours: 0,
          actual_hours: 0,
          overrun_hours: 0,
          overrun_cost: 0,
          total_jobs: 0
        });
      }
      
      const quarterData = quarterlyData.get(quarter)!;
      quarterData.planned_hours += plannedHours;
      quarterData.actual_hours += actualHours;
      quarterData.overrun_hours += overrunHours;
      quarterData.overrun_cost += overrunCost;
      
      // Work center data - ensure we're not adding "Grand Total" 
      // and ALWAYS use operational work center when available
      if (workCenter && workCenter.trim() !== 'Grand Total') {
        if (!workCenterMap.has(workCenter)) {
          workCenterMap.set(workCenter, {
            work_center: workCenter,
          job_count: 0,
          planned_hours: 0,
          actual_hours: 0,
          overrun_hours: 0,
          overrun_cost: 0
        });
      }
      
        const centerData = workCenterMap.get(workCenter)!;
        centerData.planned_hours += plannedHours;
        centerData.actual_hours += actualHours;
        centerData.overrun_hours += overrunHours;
        centerData.overrun_cost += overrunCost;
      }
    }
    
    // Count unique jobs once (not inside main loop for efficiency)
    const jobsByQuarter = new Map<number, Set<string>>();
    const jobsByWorkCenter = new Map<string, Set<string>>();
    const jobsByPartWithNcr = new Map<string, Set<string>>();
    
    for (const record of filteredData) {
      // Get the work center (prefer oper_work_center if available)
      const workCenter = record.oper_work_center || record.work_center;
      
      // Quarter job counting
      const date = new Date(record.date);
      const quarter = Math.floor((date.getMonth() / 3) + 1);
      
      if (!jobsByQuarter.has(quarter)) {
        jobsByQuarter.set(quarter, new Set());
      }
      jobsByQuarter.get(quarter)!.add(record.job_id);
      
      // Work center job counting
      if (workCenter && workCenter.trim() !== 'Grand Total') {
        if (!jobsByWorkCenter.has(workCenter)) {
          jobsByWorkCenter.set(workCenter, new Set());
        }
        jobsByWorkCenter.get(workCenter)!.add(record.job_id);
      }
      
      // NCR part job counting - use our helper function
      if (isNcrRecord(record)) {
        if (!jobsByPartWithNcr.has(record.part_name)) {
          jobsByPartWithNcr.set(record.part_name, new Set());
        }
        jobsByPartWithNcr.get(record.part_name)!.add(record.job_id);
      }
    }
    
    // Update job counts for quarterly data
    for (const [quarter, jobs] of Array.from(jobsByQuarter.entries())) {
      if (quarterlyData.has(quarter)) {
        quarterlyData.get(quarter)!.total_jobs = jobs.size;
      }
    }
    
    // Update job counts for work centers
    for (const [center, jobs] of Array.from(jobsByWorkCenter.entries())) {
      if (workCenterMap.has(center)) {
        workCenterMap.get(center)!.job_count = jobs.size;
      }
    }
    
    // Update job counts for parts with NCR failures
    for (const [part, jobs] of Array.from(jobsByPartWithNcr.entries())) {
      if (partFailureMap.has(part)) {
        partFailureMap.get(part)!.job_count = jobs.size;
      }
    }
    
    // Sort overrun jobs and take top 20
    overrunJobs.sort((a, b) => b.overrun_hours - a.overrun_hours);
    const top20OverrunJobs = overrunJobs.slice(0, 20);
    
    // Sort NCR failures and take top 20
    ncrFailures.sort((a, b) => b.overrun_hours - a.overrun_hours);
    const top20NcrFailures = ncrFailures.slice(0, 20);
    
    // Filter to parts with more than one job
    const repeatFailures = Array.from(partFailureMap.values())
      .filter(p => p.job_count > 1)
      .sort((a, b) => b.overrun_cost - a.overrun_cost)
      .slice(0, 20);
    
    console.log("Processing complete:", {
      quarterCount: quarterlyData.size,
      workCenterCount: workCenterMap.size,
      overrunJobCount: top20OverrunJobs.length,
      ncrFailureCount: top20NcrFailures.length,
      repeatFailureCount: repeatFailures.length
    });
    
    // Ensure we have valid data to return
    // Validate each NCR record to prevent null/undefined errors
    const validatedNcrSummary = ncrFailures.map(record => ({
      job_number: record.job_number || '',
      part_name: record.part_name || '',
      work_center: record.work_center || '',
      failure_reason: record.failure_reason || '',
      planned_hours: record.planned_hours || 0,
      actual_hours: record.actual_hours || 0,
      overrun_hours: record.overrun_hours || 0,
      overrun_cost: record.overrun_cost || 0
    }));
    
    // Validate each repeat NCR failure
    const validatedRepeatFailures = repeatFailures.map(record => ({
      part_name: record.part_name || '',
      job_count: record.job_count || 0,
      planned_hours: record.planned_hours || 0,
      actual_hours: record.actual_hours || 0,
      overrun_hours: record.overrun_hours || 0,
      overrun_cost: record.overrun_cost || 0
    }));
    
    const result = {
      summary: summaryData,
      quarterly_summary: Array.from(quarterlyData.values()),
      top_overruns: top20OverrunJobs,
      workcenter_summary: Array.from(workCenterMap.values())
        .sort((a, b) => b.overrun_cost - a.overrun_cost),
      ncr_summary: validatedNcrSummary,
      repeat_ncr_failures: validatedRepeatFailures
    };
    
    // Log the NCR summary data to verify what's being sent to the components
    console.log("NCR summary data:", {
      ncrCount: result.ncr_summary.length,
      repeatNcrCount: result.repeat_ncr_failures.length,
      hasNcrData: result.ncr_summary.length > 0,
      ncrSummaryExample: result.ncr_summary.length > 0 ? result.ncr_summary[0] : null,
      repeatNcrExample: result.repeat_ncr_failures.length > 0 ? result.repeat_ncr_failures[0] : null
    });
    
    return result;
  };

  // Final data will either be the processed data or a default empty structure
  const finalData: YearData = useMemo(() => {
    if (processedData) return processedData;
    
    return {
    summary: {
      total_planned_hours: 0,
      total_actual_hours: 0,
      total_overrun_hours: 0,
      ghost_hours: 0,
      total_ncr_hours: 0,
      total_planned_cost: 0,
      total_actual_cost: 0,
      opportunity_cost_dollars: 0
    },
    quarterly_summary: [],
    top_overruns: [],
    workcenter_summary: [],
    ncr_summary: [],
    repeat_ncr_failures: []
  };
  }, [processedData]);

  const isDetailedProcessing = isProcessing && showDetails;
  const showLoading = isLoading; // Only show loading for initial summary data fetch

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-sulzer-blue text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/">
                  <Button variant="ghost" className="text-white mr-2">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </Link>
                <span className="text-2xl font-bold">Sulzer Dashboard - {year}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards for this year */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{year} Summary</h2>
          {showLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
              <p>Error loading data: {String(error)}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4" id="yearSummaryCards">
              <Card className="card-transition">
                <CardContent className="pt-6">
                  <h3 className="text-sm font-medium text-gray-500">Planned Hours</h3>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(finalData.summary.total_planned_hours || 0)}</p>
                </CardContent>
              </Card>
              <Card className="card-transition">
                <CardContent className="pt-6">
                  <h3 className="text-sm font-medium text-gray-500">Actual Hours</h3>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(finalData.summary.total_actual_hours || 0)}</p>
                </CardContent>
              </Card>
              <Card className="card-transition">
                <CardContent className="pt-6">
                  <h3 className="text-sm font-medium text-gray-500">Overrun Hours</h3>
                  <p className="text-2xl font-bold text-sulzer-danger">{formatNumber(finalData.summary.total_overrun_hours || 0)}</p>
                </CardContent>
              </Card>
              <Card className="card-transition">
                <CardContent className="pt-6">
                  <h3 className="text-sm font-medium text-gray-500">Ghost Hours</h3>
                  <p className="text-2xl font-bold text-gray-500">{formatNumber(finalData.summary.ghost_hours || 0)}</p>
                  <div className="text-xs text-gray-500 mt-1">*Planned time with no recorded work</div>
                </CardContent>
              </Card>
              <Card className="card-transition">
                <CardContent className="pt-6">
                  <h3 className="text-sm font-medium text-gray-500">NCR Hours</h3>
                  <p className="text-2xl font-bold text-sulzer-warning">{formatNumber(finalData.summary.total_ncr_hours || 0)}</p>
                </CardContent>
              </Card>
              <Card className="card-transition">
                <CardContent className="pt-6">
                  <h3 className="text-sm font-medium text-gray-500">Planned Cost</h3>
                  <p className="text-2xl font-bold text-gray-900">{formatMoney(finalData.summary.total_planned_cost || 0)}</p>
                </CardContent>
              </Card>
              <Card className="card-transition">
                <CardContent className="pt-6">
                  <h3 className="text-sm font-medium text-gray-500">Actual Cost</h3>
                  <p className="text-2xl font-bold text-sulzer-danger">{formatMoney(finalData.summary.total_actual_cost || 0)}</p>
                </CardContent>
              </Card>
              <Card className="card-transition">
                <CardContent className="pt-6">
                  <h3 className="text-sm font-medium text-gray-500">Opportunity Cost</h3>
                  <p className="text-2xl font-bold text-sulzer-danger">{formatMoney(finalData.summary.opportunity_cost_dollars || 0)}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Show View Details button if we have summary but not showing details yet */}
        {!showLoading && !showDetails && (
          <div className="flex justify-center mb-6">
            <Button 
              onClick={() => setShowDetails(true)}
              variant="outline"
              className="px-6"
            >
              View Detailed Breakdown
            </Button>
          </div>
        )}

        {/* Only show these sections when we're in details mode */}
        {showDetails && (
          <>
        {/* Quarterly Table */}
            {!isDetailedProcessing && finalData.quarterly_summary.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Quarterly Breakdown</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200" id="quarterlyTable">
                    <thead>
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quarter</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overrun</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jobs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finalData.quarterly_summary.map((q) => (
                        <tr key={q.quarter} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{q.quarter}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{formatNumber(q.planned_hours)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{formatNumber(q.actual_hours)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{formatNumber(q.overrun_hours)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-sulzer-danger">{formatMoney(q.overrun_cost)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{formatNumber(q.total_jobs, 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

            {/* Debug NCR Data */}
            {!isDetailedProcessing && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <h3 className="text-lg font-semibold text-yellow-800">Debug: NCR Data Status</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>NCR Records Found: {finalData.ncr_summary.length}</p>
                  <p>Repeat NCR Records Found: {finalData.repeat_ncr_failures.length}</p>
                  <p>NCR Hours Total: {formatNumber(finalData.summary.total_ncr_hours || 0)}</p>
                  {finalData.ncr_summary.length === 0 && (
                    <p className="mt-2 font-bold">No NCR records detected. Please check the console logs.</p>
                  )}
                </div>
              </div>
            )}

            {/* Tabbed Content - Lazy loaded */}
            <Suspense fallback={<div className="text-center py-10"><Skeleton className="h-64 w-full" /></div>}>
              <LazyDetailedTabs 
                yearData={finalData} 
                isLoading={isDetailedProcessing} 
                year={year} 
              />
            </Suspense>
          </>
        )}
      </main>
    </div>
  );
}
