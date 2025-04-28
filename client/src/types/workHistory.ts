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
  total_unique_parts?: number;
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
}

export interface YearlySummary {
  year: string;
  planned_hours: number;
  actual_hours: number;
  unique_parts: number;
  planned_cost: number;
  actual_cost: number;
  job_count: number;
  companies?: string[]; // Array of company names
}

export interface QuarterlySummary {
  label: string; // Format: "Q1 2023"
  company_name: string;
  planned_cost: number;
  actual_cost: number;
  overrun_percentage: number;
  job_count: number;
}

export interface WorkcenterSummary {
  work_center: string;
  planned_hours: number;
  actual_hours: number;
  overrun_hours: number;
  overrun_cost: number;
}

export interface OverrunJob {
  job_number: string;
  part_name: string;
  work_center: string;
  task_description: string;
  planned_hours: number;
  actual_hours: number;
  overrun_hours: number;
  overrun_cost: number;
}

export interface NCRSummary {
  part_name: string;
  total_ncr_hours: number;
  total_ncr_cost: number;
  ncr_occurrences: number;
}

export interface NCRDetails {
  job_number: string;
  work_order_number: string;
  ncr_hours: number;
}

export interface RepeatNCRFailure {
  part_name: string;
  total_jobs: number;
  total_ncrs: number;
  first_seen_year: string;
  years_occurring: number;
}

export interface YearSummary {
  summary: {
    total_planned_hours: number;
    total_actual_hours: number;
    total_overrun_hours: number;
    ghost_hours: number;
    total_ncr_hours: number;
    total_planned_cost: number;
    total_actual_cost: number;
    opportunity_cost_dollars: number;
    recommended_buffer_percent: number;
    total_jobs: number;
    total_operations: number;
    total_unique_parts: number;
    planning_accuracy?: number;
  };
  quarterly_summary: QuarterlySummary[];
  top_overruns: OverrunJob[];
  ncr_summary: NCRSummary[];
  workcenter_summary: WorkcenterSummary[];
  repeat_ncr_failures: RepeatNCRFailure[];
  ncr_averages?: {
    avg_ncr_cost_per_year: number;
    avg_parts_with_ncr_per_year: number;
  };
}

export interface FilterState {
  year: string;
  customer: string;
  jobType: string;
  workCenter: string;
}
