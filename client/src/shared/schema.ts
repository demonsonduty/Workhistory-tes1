export interface WorkHistory {
  date: string;
  job_id: string;
  part_id: string;
  work_center: string;
  company_name: string;
  planned_hours: number;
  actual_hours: number;
  labor_rate: number;
}

export interface YearlySummary {
  year: string;
  planned_hours: number;
  actual_hours: number;
  unique_parts: number;
  planned_cost?: number;
  actual_cost: number;
  job_count: number;
  companies: string[];
}

export interface QuarterlySummary {
  label: string;
  company_name: string;
  planned_cost: number;
  actual_cost: number;
  overrun_percentage: number;
  job_count: number;
}

export interface WorkCenterSummary {
  work_center: string;
  company_name: string;
  total_planned_hours: number;
  total_actual_hours: number;
  overrun_hours: number;
  overrun_cost: number;
} 