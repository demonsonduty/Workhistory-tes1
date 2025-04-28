'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DebugPage() {
  const [yearData, setYearData] = useState<any>(null);
  const [year, setYear] = useState('2025');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchYearData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/workhistory/summary/year/${year}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      
      const data = await response.json();
      setYearData(data);
      
      // Specially log the top_overruns array to see its contents
      console.log("Fetched data for year:", year);
      console.log("Found top_overruns:", data.top_overruns ? `${data.top_overruns.length} items` : 'Not available');
      
      if (data.top_overruns && data.top_overruns.length > 0) {
        console.log("First overrun item:", data.top_overruns[0]);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">API Debug Tool</h1>
      
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Year</label>
          <input 
            type="text" 
            value={year} 
            onChange={(e) => setYear(e.target.value)}
            className="border rounded px-3 py-2 w-32"
          />
        </div>
        
        <div className="flex items-end">
          <Button 
            onClick={fetchYearData}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Fetch Data'}
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {yearData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
                {JSON.stringify(yearData.summary, null, 2)}
              </pre>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Overruns ({yearData.top_overruns?.length || 0} items)</CardTitle>
            </CardHeader>
            <CardContent>
              {yearData.top_overruns && yearData.top_overruns.length > 0 ? (
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
                  {JSON.stringify(yearData.top_overruns.slice(0, 3), null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500">No overrun data available</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Workcenter Summary ({yearData.workcenter_summary?.length || 0} items)</CardTitle>
            </CardHeader>
            <CardContent>
              {yearData.workcenter_summary && yearData.workcenter_summary.length > 0 ? (
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
                  {JSON.stringify(yearData.workcenter_summary.slice(0, 3), null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500">No workcenter data available</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>NCR Summary ({yearData.ncr_summary?.length || 0} items)</CardTitle>
            </CardHeader>
            <CardContent>
              {yearData.ncr_summary && yearData.ncr_summary.length > 0 ? (
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
                  {JSON.stringify(yearData.ncr_summary.slice(0, 3), null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500">No NCR data available</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Repeat NCR Failures ({yearData.repeat_ncr_failures?.length || 0} items)</CardTitle>
            </CardHeader>
            <CardContent>
              {yearData.repeat_ncr_failures && yearData.repeat_ncr_failures.length > 0 ? (
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
                  {JSON.stringify(yearData.repeat_ncr_failures.slice(0, 3), null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500">No repeat failures data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 