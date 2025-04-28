import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import QuarterlyChart from './charts/QuarterlyChart';
import { useQuarterlyTrends } from '@/hooks/useWorkHistoryData';
import { useLocation } from 'wouter';

interface AggregatedQuarterData {
  label: string;
  companies: string[];
  planned_cost: number;
  actual_cost: number;
  overrun_percentage: number;
  job_count: number;
}

export default function QuarterlyTrends() {
  const [_, navigate] = useLocation();
  const { data: quarterlyData, isLoading } = useQuarterlyTrends();

  const handleQuarterClick = (data: AggregatedQuarterData) => {
    const year = data.label.split(' ')[1];
    navigate(`/workhistory/year/${year}`);
  };

  if (isLoading) {
    return (
      <Card className="shadow mb-6">
        <CardContent className="p-4">
          <div className="h-[300px]">
            <Skeleton className="w-full h-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quarterlyData || quarterlyData.length === 0) {
    return (
      <Card className="shadow mb-6">
        <CardContent className="p-4 text-center">
          <p className="text-gray-500">No quarterly trend data available</p>
        </CardContent>
      </Card>
    );
  }

  // Group data by quarter and aggregate values
  const processedData = quarterlyData.reduce<AggregatedQuarterData[]>((acc, curr) => {
    const existingQuarter = acc.find(q => q.label === curr.label);
    if (existingQuarter) {
      existingQuarter.planned_cost += Number(curr.planned_cost || 0);
      existingQuarter.actual_cost += Number(curr.actual_cost || 0);
      existingQuarter.job_count += Number(curr.job_count || 0);
      
      if (!existingQuarter.companies.includes(curr.company_name)) {
        existingQuarter.companies.push(curr.company_name);
      }
      
      // Recalculate overrun percentage
      existingQuarter.overrun_percentage = existingQuarter.planned_cost > 0
        ? ((existingQuarter.actual_cost - existingQuarter.planned_cost) / existingQuarter.planned_cost * 100)
        : 0;
    } else {
      acc.push({
        label: curr.label,
        planned_cost: Number(curr.planned_cost || 0),
        actual_cost: Number(curr.actual_cost || 0),
        job_count: Number(curr.job_count || 0),
        overrun_percentage: curr.planned_cost > 0
          ? ((Number(curr.actual_cost || 0) - Number(curr.planned_cost || 0)) / Number(curr.planned_cost || 0) * 100)
          : 0,
        companies: [curr.company_name]
      });
    }
    return acc;
  }, []);

  // Sort by year and quarter descending to show most recent first
  const sortedData = [...processedData].sort((a, b) => {
    if (!a.label || !b.label) return 0;
    
    const [quarterA, yearA] = a.label.split(' ');
    const [quarterB, yearB] = b.label.split(' ');
    
    if (!yearA || !yearB) return 0;
    
    const yearDiff = parseInt(yearB) - parseInt(yearA);
    if (yearDiff !== 0) return yearDiff;
    
    const qA = quarterA?.slice(1);
    const qB = quarterB?.slice(1);
    
    if (!qA || !qB) return 0;
    
    return parseInt(qB) - parseInt(qA);
  }).slice(0, 8); // Show last 8 quarters

  return (
    <Card className="shadow mb-6">
      <CardContent className="p-4">
        <div className="chart-container" style={{ minHeight: "300px" }}>
          {sortedData.length > 0 ? (
            <QuarterlyChart
              data={sortedData}
              onDataClick={handleQuarterClick}
            />
          ) : (
            <div className="text-center p-4">
              <p className="text-gray-500">Insufficient data to display chart</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
