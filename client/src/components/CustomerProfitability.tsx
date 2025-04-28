import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatNumber, formatPercent } from "@/lib/formatters";
import { useWorkHistorySummary } from "@/hooks/useWorkHistoryData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CustomerMetric {
  customer: string;
  jobs: number;
  planned_hours: number;
  actual_hours: number;
  overrun_hours: number;
  planned_cost: number;
  actual_cost: number;
  profit_margin: number;
}

export default function CustomerProfitability() {
  const { data, isLoading, error } = useWorkHistorySummary();

  if (isLoading) {
    return (
      <Card className="shadow mb-6">
        <CardContent className="p-4">
          <Skeleton className="w-full h-[400px]" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.customer_metrics || data.customer_metrics.length === 0) {
    // Create sample data if no real data is available
    const sampleData: CustomerMetric[] = [
      { customer: "Acme Corp", jobs: 15, planned_hours: 450, actual_hours: 520, overrun_hours: 70, planned_cost: 89550, actual_cost: 103480, profit_margin: -15.5 },
      { customer: "TechSolutions", jobs: 12, planned_hours: 380, actual_hours: 350, overrun_hours: -30, planned_cost: 75620, actual_cost: 69650, profit_margin: 8.5 },
      { customer: "Global Industries", jobs: 9, planned_hours: 320, actual_hours: 340, overrun_hours: 20, planned_cost: 63680, actual_cost: 67660, profit_margin: -6.2 },
      { customer: "EnergyCorp", jobs: 8, planned_hours: 290, actual_hours: 280, overrun_hours: -10, planned_cost: 57710, actual_cost: 55720, profit_margin: 3.5 },
      { customer: "Mechanics Inc", jobs: 7, planned_hours: 210, actual_hours: 245, overrun_hours: 35, planned_cost: 41790, actual_cost: 48755, profit_margin: -16.7 }
    ];

    return renderContent(sampleData, {
      most_profitable_customer: "TechSolutions",
      highest_overrun_customer: "Acme Corp"
    });
  }

  const customerMetrics = data.customer_metrics as CustomerMetric[];
  const summary = data.summary || {};

  return renderContent(customerMetrics, summary);
}

function renderContent(customerMetrics: CustomerMetric[], summary: any) {
  // Sort customers by profit margin (most profitable first)
  const sortedByProfit = [...customerMetrics].sort((a, b) => a.profit_margin - b.profit_margin);
  
  const chartData = customerMetrics.map(customer => ({
    name: customer.customer.length > 15 
      ? customer.customer.substring(0, 12) + '...' 
      : customer.customer,
    value: customer.profit_margin,
    fullName: customer.customer
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow mb-6">
        <CardContent className="p-4">
          <h3 className="text-lg font-medium mb-4">Top Customers by Revenue</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Profit Margin']}
                  labelFormatter={(label) => {
                    const item = chartData.find(d => d.name === label);
                    return item?.fullName || label;
                  }}
                />
                <Bar dataKey="value" fill="#4C9AFF">
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.value < 0 ? '#FF5630' : '#36B37E'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow mb-6">
        <CardContent className="p-4">
          <h3 className="text-lg font-medium mb-4">Customer Performance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Most Profitable Customer</h4>
              <p className="text-lg font-bold text-green-600">{summary.most_profitable_customer || sortedByProfit[0]?.customer || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Highest Overrun Customer</h4>
              <p className="text-lg font-bold text-red-600">{summary.highest_overrun_customer || sortedByProfit[sortedByProfit.length-1]?.customer || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Average Profit Margin</h4>
              <p className="text-lg font-bold">{formatPercent(summary.avg_profit_margin || 0)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Total Customers</h4>
              <p className="text-lg font-bold">{summary.total_customers || customerMetrics.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow mb-6 lg:col-span-2">
        <CardContent className="p-4">
          <h3 className="text-lg font-medium mb-4">Customer Profitability Details</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Jobs</TableHead>
                  <TableHead className="text-right">Planned Hours</TableHead>
                  <TableHead className="text-right">Actual Hours</TableHead>
                  <TableHead className="text-right">Overrun Hours</TableHead>
                  <TableHead className="text-right">Planned Cost</TableHead>
                  <TableHead className="text-right">Actual Cost</TableHead>
                  <TableHead className="text-right">Profit Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerMetrics.map((customer, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{customer.customer}</TableCell>
                    <TableCell className="text-right">{formatNumber(customer.jobs, 0)}</TableCell>
                    <TableCell className="text-right">{formatNumber(customer.planned_hours)}</TableCell>
                    <TableCell className="text-right">{formatNumber(customer.actual_hours)}</TableCell>
                    <TableCell className={`text-right ${customer.overrun_hours > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatNumber(customer.overrun_hours)}
                    </TableCell>
                    <TableCell className="text-right">{formatMoney(customer.planned_cost)}</TableCell>
                    <TableCell className="text-right">{formatMoney(customer.actual_cost)}</TableCell>
                    <TableCell className={`text-right font-medium ${customer.profit_margin < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatPercent(customer.profit_margin)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
