'use client';

import { useState, useEffect } from 'react';
import { DashboardTabs } from '@/components/DashboardTabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatabaseViewer } from '@/components/DatabaseViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');
  const [debugData, setDebugData] = useState<any>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  
  // Generate years from 2015 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2014 },
    (_, i) => String(2015 + i)
  );
  
  // Function to run data diagnostics
  const runDiagnostics = async () => {
    setIsDebugging(true);
    try {
      // Fetch basic stats from work_history to verify data
      const response = await fetch('/api/debug');
      if (!response.ok) {
        throw new Error('Failed to fetch debug data');
      }
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      console.error('Diagnostics error:', error);
    } finally {
      setIsDebugging(false);
    }
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">Production Dashboard</h1>
      <p className="text-gray-600 mb-6">
        Analyze production performance and identify areas for improvement
      </p>
      
      <div className="flex gap-4 mb-6">
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
              {years.map(year => (
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
        
        <div className="ml-auto">
          <Button 
            variant="outline" 
            className="mt-6"
            onClick={runDiagnostics} 
            disabled={isDebugging}
          >
            {isDebugging ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              'Run Data Diagnostics'
            )}
          </Button>
        </div>
      </div>
      
      {debugData && (
        <Card className="mb-8 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg">Data Diagnostics Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Date Range:</h3>
                {debugData.dateRange ? (
                  <p>Min Date: <span className="font-mono">{debugData.dateRange.min}</span><br />
                     Max Date: <span className="font-mono">{debugData.dateRange.max}</span></p>
                ) : (
                  <p className="text-red-600">No date data found</p>
                )}
              </div>
              <div>
                <h3 className="font-medium mb-2">Years in Database:</h3>
                {debugData.years && debugData.years.length > 0 ? (
                  <p className="font-mono">{debugData.years.join(', ')}</p>
                ) : (
                  <p className="text-red-600">No year data found</p>
                )}
              </div>
              <div>
                <h3 className="font-medium mb-2">Row Count:</h3>
                <p className="font-mono">{debugData.rowCount || 0} records</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Planned vs Actual Hours:</h3>
                {debugData.hours ? (
                  <p>
                    Total Planned: <span className="font-mono">{debugData.hours.planned.toFixed(1)}</span><br />
                    Total Actual: <span className="font-mono">{debugData.hours.actual.toFixed(1)}</span>
                  </p>
                ) : (
                  <p className="text-red-600">No hours data found</p>
                )}
              </div>
              {debugData.sampleRows && debugData.sampleRows.length > 0 && (
                <div className="col-span-2">
                  <h3 className="font-medium mb-2">Sample Row:</h3>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(debugData.sampleRows[0], null, 2)}
                  </pre>
                </div>
              )}
              {debugData.message && (
                <div className="col-span-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-amber-700">{debugData.message}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="mb-8">
        <DashboardTabs year={selectedYear} quarter={selectedQuarter} />
      </div>
      
      <h2 className="text-2xl font-bold mb-4 mt-10 border-t pt-8">Database Records</h2>
      <DatabaseViewer />
    </div>
  );
} 