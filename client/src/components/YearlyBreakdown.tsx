import { useLocation } from "wouter";
import { Card, CardContent } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { formatMoney, formatNumber } from "@/lib/formatters";
import { Skeleton } from "./ui/skeleton";
import { useYearlyData } from "@/hooks/useWorkHistoryData";

export default function YearlyBreakdown() {
  const [_, navigate] = useLocation();
  const { data: yearlyData, isLoading } = useYearlyData();

  if (isLoading) {
    return (
      <Card className="shadow mb-6">
        <CardContent className="p-4">
          <Skeleton className="w-full h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  if (!yearlyData || yearlyData.length === 0) {
    return (
      <Card className="shadow mb-6">
        <CardContent className="p-4 text-center">
          <p className="text-gray-500">No yearly data available</p>
        </CardContent>
      </Card>
    );
  }

  // Sort data by year in descending order (newest first)
  const sortedData = [...yearlyData].sort((a, b) =>
    parseInt(b.year) - parseInt(a.year)
  );

  return (
    <Card className="shadow mb-6">
      <CardContent className="p-4">
        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Year</TableHead>
                <TableHead>Companies</TableHead>
                <TableHead className="text-right">Jobs</TableHead>
                <TableHead className="text-right">Parts</TableHead>
                <TableHead className="text-right">Planned Hours</TableHead>
                <TableHead className="text-right">Actual Hours</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((year) => (
                <TableRow
                  key={year.year}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => navigate(`/workhistory/year/${year.year}`)}
                >
                  <TableCell className="font-medium">{year.year}</TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate">
                      {year.companies && Array.isArray(year.companies) 
                        ? year.companies.join(", ")
                        : "No companies"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(year.job_count)}</TableCell>
                  <TableCell className="text-right">{formatNumber(year.unique_parts || 0)}</TableCell>
                  <TableCell className="text-right">{formatNumber(year.planned_hours)}</TableCell>
                  <TableCell className="text-right">{formatNumber(year.actual_hours)}</TableCell>
                  <TableCell className="text-right">{formatMoney(year.actual_cost || 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
