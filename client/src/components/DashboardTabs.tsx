import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';

interface DashboardTabsProps {
  year?: string;
  quarter?: string;
}

export function DashboardTabs({ year = 'all', quarter = 'all' }: DashboardTabsProps) {
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReportData() {
      setIsLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        if (year) params.append('year', year);
        if (quarter) params.append('quarter', quarter);
        
        console.log(`Fetching report data with params: year=${year}, quarter=${quarter}`);
        const response = await fetch(`/api/reports?${params.toString()}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Report data received:', data);
        
        if (data.error) {
          throw new Error(`API returned error: ${data.error}`);
        }
        
        if (!data.topOverruns || !data.workcenterPerformance || 
            !data.repeatOffenders || !data.jobAdjustments || !data.ncrFailures) {
          console.warn('Some data sections are missing from API response', data);
        }
        
        // Check if we have any data in any section
        const hasAnyData = 
          (data.topOverruns && data.topOverruns.length > 0) ||
          (data.workcenterPerformance && data.workcenterPerformance.length > 0) ||
          (data.repeatOffenders && data.repeatOffenders.length > 0) ||
          (data.jobAdjustments && data.jobAdjustments.length > 0) ||
          (data.ncrFailures && data.ncrFailures.length > 0);
        
        if (!hasAnyData) {
          console.warn('No data found in any section');
          
          // Log available years from metadata if present
          if (data.meta && data.meta.availableYears) {
            console.log('Available years in database:', data.meta.availableYears);
          }
          
          // Check if there's a year filter issue
          if (data.meta && data.meta.yearFilterIssue) {
            console.warn('Year filter issue:', data.meta.yearFilterIssue);
          }
        }
        
        setReportData(data);
      } catch (error) {
        console.error('Error fetching report data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchReportData();
  }, [year, quarter]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading dashboard data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <p className="mt-2 text-muted-foreground">
            Please ensure your database is properly configured and API routes are set up.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  if (!reportData || !Object.keys(reportData).length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Dashboard Data Available</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>No dashboard data available for the selected period.</p>
          
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-md text-amber-800">
            <h3 className="font-medium text-amber-900 mb-2">Possible Issues:</h3>
            <ul className="list-disc pl-5 space-y-1 mb-3">
              <li>There may be no overruns in your data (planned hours ≥ actual hours)</li>
              <li>The database may not have any data for the selected year/quarter</li>
              <li>Your data may have incorrect date formatting (all in 2025 or similar)</li>
              <li>Database connection issues</li>
            </ul>
            <p className="text-sm">Try the "Run Data Diagnostics" button in the main dashboard to check your data.</p>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch('/api/simplereport');
                  if (!response.ok) throw new Error('API error');
                  const data = await response.json();
                  console.log('Simple report diagnostics:', data);
                  
                  // Show diagnostic info as an alert
                  alert(
                    `Database Diagnostic Results:\n\n` +
                    `Total Rows: ${data.totalRows}\n` +
                    `Rows with Overruns: ${data.overrunCount}\n` +
                    `Jobs: ${data.jobCount}\n` +
                    `Work Centers: ${data.workCenterCount}\n\n` +
                    `Message: ${data.message}\n\n` +
                    `Check browser console for more details.`
                  );
                } catch (err) {
                  console.error('Diagnostics failed:', err);
                  alert('Diagnostics failed. Check console for details.');
                }
              }}
            >
              Run Quick Diagnostics
            </Button>
            
            <Button
              onClick={() => {
                window.location.href = '/dashboard';
              }}
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="overruns" className="w-full">
      <TabsList className="grid grid-cols-5 mb-4">
        <TabsTrigger value="overruns">Top Jobs by Hours</TabsTrigger>
        <TabsTrigger value="ncr">Job Performance Metrics</TabsTrigger>
        <TabsTrigger value="workcenters">Workcenter Performance</TabsTrigger>
        <TabsTrigger value="repeats">Multi-Job Parts</TabsTrigger>
        <TabsTrigger value="adjustments">Parts Metrics</TabsTrigger>
      </TabsList>
      
      {/* Top Overrun Jobs Tab */}
      <TabsContent value="overruns">
        <Card>
          <CardHeader>
            <CardTitle>Top Jobs by Hours</CardTitle>
            <CardDescription>
              Jobs with the highest planned or actual hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.topOverruns && reportData.topOverruns.length > 0 ? (
              <div className="border rounded-md overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job #</TableHead>
                      <TableHead>Part Name</TableHead>
                      <TableHead>Work Center</TableHead>
                      <TableHead className="text-right">Planned Hours</TableHead>
                      <TableHead className="text-right">Actual Hours</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead className="text-right">Efficiency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.topOverruns.map((item: any, index: number) => {
                      const efficiency = item.planned_hours > 0 
                        ? (item.actual_hours / item.planned_hours * 100).toFixed(1) 
                        : "N/A";
                      const isOverrun = item.actual_hours > item.planned_hours;
                      return (
                        <TableRow key={index}>
                          <TableCell>{item.job_number}</TableCell>
                          <TableCell>{item.part_name}</TableCell>
                          <TableCell>{item.work_center}</TableCell>
                          <TableCell className="text-right">{item.planned_hours.toFixed(1)}</TableCell>
                          <TableCell className="text-right">{item.actual_hours.toFixed(1)}</TableCell>
                          <TableCell className={`text-right font-medium ${isOverrun ? 'text-red-600' : 'text-green-600'}`}>
                            {(item.actual_hours - item.planned_hours).toFixed(1)}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            parseFloat(efficiency) > 100 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {efficiency}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No job data found for this period
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* NCR Failures Tab */}
      <TabsContent value="ncr">
        <Card>
          <CardHeader>
            <CardTitle>Job Performance Metrics</CardTitle>
            <CardDescription>
              Jobs with significant variance between planned and actual hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.ncrFailures && reportData.ncrFailures.length > 0 ? (
              <div className="border rounded-md overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job #</TableHead>
                      <TableHead>Part Name</TableHead>
                      <TableHead>Work Center</TableHead>
                      <TableHead className="text-right">Planned Hours</TableHead>
                      <TableHead className="text-right">Actual Hours</TableHead>
                      <TableHead className="text-right">Efficiency %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.ncrFailures.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.job_number}</TableCell>
                        <TableCell>{item.part_name}</TableCell>
                        <TableCell>{item.work_center}</TableCell>
                        <TableCell className="text-right">{item.planned_hours.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{item.actual_hours.toFixed(1)}</TableCell>
                        <TableCell className={`text-right font-medium ${
                          item.efficiency_percent > 100 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {item.efficiency_percent}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No job performance data found for this period
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* Workcenter Performance Tab */}
      <TabsContent value="workcenters">
        <Card>
          <CardHeader>
            <CardTitle>Workcenter Performance</CardTitle>
            <CardDescription>
              Efficiency metrics by work center
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.workcenterPerformance && reportData.workcenterPerformance.length > 0 ? (
              <div className="border rounded-md overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Work Center</TableHead>
                      <TableHead className="text-right">Job Count</TableHead>
                      <TableHead className="text-right">Planned Hours</TableHead>
                      <TableHead className="text-right">Actual Hours</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead className="text-right">Efficiency %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.workcenterPerformance.map((item: any, index: number) => {
                      const variance = item.actual_hours - item.planned_hours;
                      const isOverrun = variance > 0;
                      return (
                        <TableRow key={index}>
                          <TableCell>{item.work_center}</TableCell>
                          <TableCell className="text-right">{item.job_count}</TableCell>
                          <TableCell className="text-right">{item.planned_hours.toFixed(1)}</TableCell>
                          <TableCell className="text-right">{item.actual_hours.toFixed(1)}</TableCell>
                          <TableCell className={`text-right font-medium ${isOverrun ? 'text-red-600' : 'text-green-600'}`}>
                            {variance.toFixed(1)}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            item.efficiency_percent > 100 ? 'text-red-600' : 
                            item.efficiency_percent < 95 ? 'text-green-600' : 'text-amber-600'
                          }`}>
                            {item.efficiency_percent}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No workcenter data found for this period
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* Repeat Offenders Tab */}
      <TabsContent value="repeats">
        <Card>
          <CardHeader>
            <CardTitle>Multi-Job Parts</CardTitle>
            <CardDescription>
              Parts that appear in multiple jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.repeatOffenders && reportData.repeatOffenders.length > 0 ? (
              <div className="border rounded-md overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Name</TableHead>
                      <TableHead className="text-right">Job Count</TableHead>
                      <TableHead className="text-right">Planned Hours</TableHead>
                      <TableHead className="text-right">Actual Hours</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead className="text-right">Efficiency %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.repeatOffenders.map((item: any, index: number) => {
                      const variance = item.actual_hours - item.planned_hours;
                      const isOverrun = variance > 0;
                      return (
                        <TableRow key={index}>
                          <TableCell>{item.part_name}</TableCell>
                          <TableCell className="text-right">{item.job_count}</TableCell>
                          <TableCell className="text-right">{item.planned_hours.toFixed(1)}</TableCell>
                          <TableCell className="text-right">{item.actual_hours.toFixed(1)}</TableCell>
                          <TableCell className={`text-right font-medium ${isOverrun ? 'text-red-600' : 'text-green-600'}`}>
                            {variance.toFixed(1)}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            item.overrun_percent > 100 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {item.overrun_percent}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No multi-job parts found for this period
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* Job Adjustments Tab */}
      <TabsContent value="adjustments">
        <Card>
          <CardHeader>
            <CardTitle>Parts Metrics</CardTitle>
            <CardDescription>
              Performance metrics for parts by planned hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.jobAdjustments && reportData.jobAdjustments.length > 0 ? (
              <div className="border rounded-md overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Name</TableHead>
                      <TableHead className="text-right">Planned Hours</TableHead>
                      <TableHead className="text-right">Actual Hours</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead className="text-right">Efficiency %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.jobAdjustments.map((item: any, index: number) => {
                      const variance = item.total_actual - item.total_planned;
                      const isOverrun = variance > 0;
                      const efficiency = item.total_planned > 0 
                        ? (item.total_actual / item.total_planned * 100).toFixed(1) 
                        : "N/A";
                      return (
                        <TableRow key={index}>
                          <TableCell>{item.part_name}</TableCell>
                          <TableCell className="text-right">{item.total_planned.toFixed(1)}</TableCell>
                          <TableCell className="text-right">{item.total_actual.toFixed(1)}</TableCell>
                          <TableCell className={`text-right font-medium ${isOverrun ? 'text-red-600' : 'text-green-600'}`}>
                            {variance.toFixed(1)}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            parseFloat(efficiency) > 100 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {efficiency}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No parts metrics available for this period
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 