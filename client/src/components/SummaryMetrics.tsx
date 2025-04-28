import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatNumber, formatPercent } from "@/lib/formatters";
import { FullSummaryData } from "@/types/summaryData";

interface SummaryMetricsProps {
  data?: FullSummaryData;
  isLoading: boolean;
}

export default function SummaryMetrics({ data, isLoading }: SummaryMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data || !data.summary) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No summary data available</p>
      </div>
    );
  }

  const summary = data.summary;

  // Calculate derived values
  const overrunPercent = summary.total_planned_hours > 0
    ? ((summary.total_overrun_hours / summary.total_planned_hours) * 100).toFixed(1) + "%"
    : "N/A";

  const avgCostPerHour = summary.total_actual_hours > 0
    ? formatMoney(summary.total_actual_cost / summary.total_actual_hours)
    : "N/A";

  const overrunCost = summary.total_actual_cost - summary.total_planned_cost > 0
    ? formatMoney(summary.total_actual_cost - summary.total_planned_cost)
    : "$0";

  const avgJobSize = summary.total_jobs > 0
    ? formatNumber(summary.total_planned_hours / summary.total_jobs)
    : "N/A";
    
  // Calculate opportunity cost (potential revenue loss from inefficiencies)
  const opportunityCost = summary.total_overrun_hours > 0
    ? summary.total_overrun_hours * (summary.total_actual_cost / summary.total_actual_hours)
    : 0;
    
  // Calculate unique customers across all data
  let uniqueCustomers = summary.total_customers || 0;
  if (uniqueCustomers === 0 && data.yearly_breakdown && data.yearly_breakdown.length > 0) {
    const allCustomers = new Set<string>();
    data.yearly_breakdown.forEach(year => {
      if (year.companies && Array.isArray(year.companies)) {
        year.companies.forEach(company => {
          if (company) allCustomers.add(company);
        });
      }
    });
    uniqueCustomers = allCustomers.size;
  }
    
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="card-transition">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Planned Hours</h3>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(summary.total_planned_hours)}</p>
            <div className="mt-2 text-sm font-medium text-gray-700">Planned</div>
          </CardContent>
        </Card>
        
        <Card className="card-transition">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Actual Hours</h3>
            <p className="text-2xl font-bold text-sulzer-danger">{formatNumber(summary.total_actual_hours)}</p>
            <div className="mt-2 text-sm font-medium text-gray-700">Actual</div>
          </CardContent>
        </Card>
        
        <Card className="card-transition">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Cost Overrun</h3>
            <p className="text-2xl font-bold text-sulzer-danger">{overrunCost}</p>
            <div className="mt-2 text-sm font-medium text-sulzer-danger">
              +{overrunPercent} from planned
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-transition">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Opportunity Cost</h3>
            <p className="text-2xl font-bold text-sulzer-blue">{formatMoney(opportunityCost || 0)}</p>
            <div className="mt-2 text-sm font-medium text-gray-700">Lost Potential</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="card-transition">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Jobs</h3>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(summary.total_jobs, 0)}</p>
          </CardContent>
        </Card>
        
        <Card className="card-transition">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Operations</h3>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(summary.total_operations, 0)}</p>
          </CardContent>
        </Card>
        
        <Card className="card-transition">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(uniqueCustomers, 0)}</p>
          </CardContent>
        </Card>
        
        <Card className="card-transition">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Avg Cost/Hour</h3>
            <p className="text-2xl font-bold text-gray-900">{avgCostPerHour}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="card-transition">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Most Used Work Center</h3>
            <p className="text-2xl font-bold text-sulzer-blue">{summary.most_used_work_center || "N/A"}</p>
          </CardContent>
        </Card>
        
        <Card className="card-transition">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Highest Overrun WC</h3>
            <p className="text-2xl font-bold text-sulzer-danger">{summary.highest_overrun_work_center || "N/A"}</p>
          </CardContent>
        </Card>
        
        <Card className="card-transition">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Most Profitable Customer</h3>
            <p className="text-2xl font-bold text-sulzer-success">{summary.most_profitable_customer || "N/A"}</p>
          </CardContent>
        </Card>
        
        <Card className="card-transition">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Avg Profit Margin</h3>
            <p className="text-2xl font-bold text-gray-900">{formatPercent(summary.avg_profit_margin || 0)}</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
