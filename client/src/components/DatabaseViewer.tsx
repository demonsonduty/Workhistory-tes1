import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { WorkHistory, YearlySummary } from '@/shared/schema';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DatabaseViewer() {
  const [workHistoryData, setWorkHistoryData] = useState<WorkHistory[]>([]);
  const [summaryData, setSummaryData] = useState<YearlySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch work_history data
        const workHistoryResponse = await fetch('/api/work-history');
        if (!workHistoryResponse.ok) {
          throw new Error(`Failed to fetch work history: ${workHistoryResponse.statusText}`);
        }
        const workHistoryData = await workHistoryResponse.json();
        setWorkHistoryData(workHistoryData);
        
        // Extract years from the data
        const years = new Set<string>();
        workHistoryData.forEach((item: WorkHistory) => {
          if (item.date) {
            const year = new Date(item.date).getFullYear().toString();
            years.add(year);
          }
        });
        
        // Sort years in descending order (newest first)
        const sortedYears = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
        setAvailableYears(sortedYears);
        
        // Set default selected year to the most recent
        if (sortedYears.length > 0) {
          setSelectedYear(sortedYears[0]);
        }
        
        // Fetch summary data
        const summaryResponse = await fetch('/api/summary');
        if (!summaryResponse.ok) {
          throw new Error(`Failed to fetch summary: ${summaryResponse.statusText}`);
        }
        const summaryData = await summaryResponse.json();
        setSummaryData(summaryData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Filter data based on selected year and quarter
  const filteredWorkHistory = workHistoryData.filter(item => {
    if (!item.date) return false;
    
    const itemDate = new Date(item.date);
    const itemYear = itemDate.getFullYear().toString();
    const itemQuarter = Math.floor(itemDate.getMonth() / 3) + 1;
    
    // Filter by year if not "all"
    if (selectedYear !== 'all' && itemYear !== selectedYear) {
      return false;
    }
    
    // Filter by quarter if not "all"
    if (selectedQuarter !== 'all') {
      const quarterNum = parseInt(selectedQuarter);
      return itemQuarter === quarterNum;
    }
    
    return true;
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading database data...</p>
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

  return (
    <Tabs defaultValue="work-history" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="work-history">Work History</TabsTrigger>
        <TabsTrigger value="summary">Yearly Summary</TabsTrigger>
      </TabsList>
      
      <TabsContent value="work-history">
        <Card>
          <CardHeader>
            <CardTitle>Work History Table</CardTitle>
            <CardDescription>
              {filteredWorkHistory.length} entries found in the database
            </CardDescription>
            
            <div className="flex gap-4 mt-4">
              <div className="w-[180px]">
                <label className="text-sm font-medium block mb-2">Year</label>
                <Select 
                  value={selectedYear} 
                  onValueChange={setSelectedYear}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-[180px]">
                <label className="text-sm font-medium block mb-2">Quarter</label>
                <Select 
                  value={selectedQuarter} 
                  onValueChange={setSelectedQuarter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select quarter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Quarters</SelectItem>
                    <SelectItem value="1">Q1 (Jan-Mar)</SelectItem>
                    <SelectItem value="2">Q2 (Apr-Jun)</SelectItem>
                    <SelectItem value="3">Q3 (Jul-Sep)</SelectItem>
                    <SelectItem value="4">Q4 (Oct-Dec)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Part ID</TableHead>
                    <TableHead>Work Center</TableHead>
                    <TableHead className="text-right">Planned Hours</TableHead>
                    <TableHead className="text-right">Actual Hours</TableHead>
                    <TableHead className="text-right">Labor Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkHistory.length > 0 ? (
                    filteredWorkHistory.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell>{item.company_name}</TableCell>
                        <TableCell>{item.job_id}</TableCell>
                        <TableCell>{item.part_id}</TableCell>
                        <TableCell>{item.work_center}</TableCell>
                        <TableCell className="text-right">{item.planned_hours}</TableCell>
                        <TableCell className="text-right">{item.actual_hours}</TableCell>
                        <TableCell className="text-right">${item.labor_rate}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">No data available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="summary">
        <Card>
          <CardHeader>
            <CardTitle>Yearly Summary</CardTitle>
            <CardDescription>
              Aggregated yearly work history data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Planned Hours</TableHead>
                    <TableHead className="text-right">Actual Hours</TableHead>
                    <TableHead className="text-right">Unique Parts</TableHead>
                    <TableHead className="text-right">Planned Cost</TableHead>
                    <TableHead className="text-right">Actual Cost</TableHead>
                    <TableHead className="text-right">Job Count</TableHead>
                    <TableHead>Companies</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryData.length > 0 ? (
                    summaryData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.year}</TableCell>
                        <TableCell className="text-right">{item.planned_hours}</TableCell>
                        <TableCell className="text-right">{item.actual_hours}</TableCell>
                        <TableCell className="text-right">{item.unique_parts}</TableCell>
                        <TableCell className="text-right">${item.planned_cost?.toLocaleString() || "N/A"}</TableCell>
                        <TableCell className="text-right">${item.actual_cost.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{item.job_count}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {Array.isArray(item.companies) 
                              ? item.companies.slice(0, 3).join(", ") + (item.companies.length > 3 ? "..." : "")
                              : "N/A"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">No summary data available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 