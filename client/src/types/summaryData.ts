// Types for the summary data returned from the API

export interface WorkHistorySummary {
  total_planned_hours: number;
  total_actual_hours: number;
  total_overrun_hours: number;
  total_ncr_hours: number;
  total_planned_cost: number;
  total_actual_cost: number;
  opportunity_cost?: number;
  total_jobs: number;
  total_operations: number;
  total_customers: number;
  avg_profit_margin?: number;
  most_profitable_customer?: string;
  highest_overrun_customer?: string;
  most_used_work_center?: string;
  highest_overrun_work_center?: string;
}

export interface YearBreakdown {
  year: string;
  planned_hours: number;
  actual_hours: number;
  overrun_hours: number;
  ncr_hours: number;
  job_count: number;
  operation_count: number;
  customer_count: number;
  companies?: string[]; // Array of company names for the year
}

export interface WorkcenterBreakdown {
  work_center: string;
  total_planned_hours: number;
  total_actual_hours: number;
  overrun_hours: number;
}

export interface CustomerMetric {
  customer: string;
  jobs: number;
  planned_hours: number;
  actual_hours: number;
  overrun_hours: number;
  planned_cost: number;
  actual_cost: number;
  profit_margin: number;
}

export interface WorkCenterMetric {
  work_center: string;
  total_hours: number;
  overrun_hours: number;
  utilization: number;
}

export interface FullSummaryData {
  summary: WorkHistorySummary;
  yearly_breakdown: YearBreakdown[];
  workcenter_breakdown: WorkcenterBreakdown[];
  customer_metrics?: CustomerMetric[];
  work_center_metrics?: WorkCenterMetric[];
}