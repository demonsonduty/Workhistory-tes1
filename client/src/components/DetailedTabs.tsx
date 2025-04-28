import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatNumber } from '@/lib/formatters';
import { Input } from '@/components/ui/input';

// Define interfaces for the data structures
interface NCRSummary {
  job_number: string;
  part_name: string;
  work_center: string;
  failure_reason: string;
  planned_hours: number;
  actual_hours: number;
  overrun_hours: number;
  overrun_cost: number;
}

interface OverrunJob {
  job_number: string;
  part_name: string;
  work_center: string;
  task_description: string;
  planned_hours: number;
  actual_hours: number;
  overrun_hours: number;
  overrun_cost: number;
}

interface WorkcenterSummary {
  work_center: string;
  job_count: number;
  planned_hours: number;
  actual_hours: number;
  overrun_hours: number;
  overrun_cost: number;
}

interface RepeatNCRFailure {
  part_name: string;
  job_count: number;
  planned_hours: number;
  actual_hours: number;
  overrun_hours: number;
  overrun_cost: number;
}

interface DetailedTabsProps {
  yearData: any;
  isLoading: boolean;
  year: string;
}

export default function DetailedTabs({ yearData, isLoading, year }: DetailedTabsProps) {
  const [activeTab, setActiveTab] = useState('overrun');
  const [ncrFilter, setNcrFilter] = useState('');
  const [overrunFilter, setOverrunFilter] = useState('');
  const [workcenterFilter, setWorkcenterFilter] = useState('');
  const [repeatNcrFilter, setRepeatNcrFilter] = useState('');

  // Add detailed console logging to see what's being received
  console.log("DetailedTabs - Props received:", { yearData, isLoading, year });
  console.log("DetailedTabs - Top overruns data:", yearData?.top_overruns);

  if (isLoading) {
    return (
      <Card className="shadow mb-6">
        <div className="flex overflow-x-auto border-b">
          <div className="px-5 py-3 font-medium">
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="p-4">
          <Skeleton className="h-64 w-full" />
        </div>
      </Card>
    );
  }

  if (!yearData) {
    console.log("DetailedTabs - yearData is null or undefined");
    return null;
  }

  const { top_overruns, ncr_summary, workcenter_summary, repeat_ncr_failures } = yearData;
  console.log("DetailedTabs - Destructured data:", { top_overruns, ncr_summary, workcenter_summary, repeat_ncr_failures });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overrun':
        return renderOverrunTab(top_overruns || []);
      case 'ncr':
        return renderNCRTab();
      case 'workcenter':
        return renderWorkcenterTab(workcenter_summary || []);
      case 'repeat':
        return renderRepeatTab(repeat_ncr_failures || []);
      case 'adjustments':
        return renderAdjustmentsTab();
      default:
        return null;
    }
  };

  return (
    <Card className="shadow mb-6 overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto border-b">
        <button 
          className={`tab-transition flex-shrink-0 px-5 py-3 font-medium ${activeTab === 'overrun' ? 'border-b-2 border-sulzer-blue text-sulzer-blue' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setActiveTab('overrun')}
        >
          Top Overrun Jobs
        </button>
        <button 
          className={`tab-transition flex-shrink-0 px-5 py-3 font-medium ${activeTab === 'ncr' ? 'border-b-2 border-sulzer-blue text-sulzer-blue' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setActiveTab('ncr')}
        >
          NCR Failures
        </button>
        <button 
          className={`tab-transition flex-shrink-0 px-5 py-3 font-medium ${activeTab === 'workcenter' ? 'border-b-2 border-sulzer-blue text-sulzer-blue' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setActiveTab('workcenter')}
        >
          Workcenter Performance
        </button>
        <button 
          className={`tab-transition flex-shrink-0 px-5 py-3 font-medium ${activeTab === 'repeat' ? 'border-b-2 border-sulzer-blue text-sulzer-blue' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setActiveTab('repeat')}
        >
          Repeat Offenders
        </button>
        <button 
          className={`tab-transition flex-shrink-0 px-5 py-3 font-medium ${activeTab === 'adjustments' ? 'border-b-2 border-sulzer-blue text-sulzer-blue' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setActiveTab('adjustments')}
        >
          Job Adjustments
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="p-4">
        {renderTabContent()}
      </div>
    </Card>
  );

  function renderOverrunTab(overruns: OverrunJob[]) {
    console.log("renderOverrunTab - received overruns:", overruns);
    
    if (!overruns || overruns.length === 0) {
      console.log("renderOverrunTab - No overrun data available");
      return <div className="text-center py-4">No overrun data available for this year.</div>;
    }

    const totalCost = overruns.reduce((sum, r) => sum + (r.overrun_cost || 0), 0);
    const totalHours = overruns.reduce((sum, r) => sum + (r.overrun_hours || 0), 0);
    
    // Check for job_number filtering
    const filteredOverruns = overruns.filter(r => 
      (r.job_number?.toLowerCase() || '').includes(overrunFilter.toLowerCase()) ||
      (r.part_name?.toLowerCase() || '').includes(overrunFilter.toLowerCase())
    );

    return (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 rounded p-3">
            <h3 className="text-sm font-medium text-gray-500">Total Overrun Cost</h3>
            <p className="text-xl font-bold text-sulzer-danger">{formatMoney(totalCost)}</p>
          </div>
          
          <div className="bg-gray-50 rounded p-3">
            <h3 className="text-sm font-medium text-gray-500">Total Overrun Hours</h3>
            <p className="text-xl font-bold text-sulzer-danger">{formatNumber(totalHours)}</p>
          </div>
          
          <div className="bg-gray-50 rounded p-3">
            <h3 className="text-sm font-medium text-gray-500">Affected Operations</h3>
            <p className="text-xl font-bold text-gray-900">{overruns.length}</p>
          </div>
        </div>
        
        <Input
          type="text"
          placeholder="🔍 Filter jobs or parts..."
          className="max-w-md mb-4"
          value={overrunFilter}
          onChange={(e) => setOverrunFilter(e.target.value)}
        />
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" id="topOverrunTable">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Center</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overrun</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOverruns.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{row.job_number || ''}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{row.part_name || ''}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{row.work_center || ''}</td>
                  <td className="px-3 py-2 text-sm text-gray-500">{row.task_description || ''}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{formatNumber(row.planned_hours || 0)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{formatNumber(row.actual_hours || 0)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-sulzer-danger">{formatNumber(row.overrun_hours || 0)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-sulzer-danger">{formatMoney(row.overrun_cost || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderNCRTab() {
    // Safely access the NCR summary data
    const ncrs = yearData?.ncr_summary || [] as NCRSummary[];
    console.log("NCR tab data received:", {count: ncrs.length, sample: ncrs.length > 0 ? ncrs[0] : null});
    
    if (isLoading) {
      return <div className="text-center py-4"><Skeleton className="h-56 w-full" /></div>;
    }
    
    if (!ncrs || ncrs.length === 0) {
      return <div className="text-center py-4">No NCR data available for this year.</div>;
    }
    
    const totalCost = ncrs.reduce((sum: number, r: NCRSummary) => sum + (r.overrun_cost || 0), 0);
    const totalHours = ncrs.reduce((sum: number, r: NCRSummary) => sum + (r.actual_hours || 0), 0);
    
    // Filter NCRs based on user input with null safety
    const filteredNcrs = ncrs.filter((r: NCRSummary) => 
      (r.part_name?.toLowerCase() || '').includes(ncrFilter.toLowerCase()) ||
      (r.job_number?.toLowerCase() || '').includes(ncrFilter.toLowerCase()) ||
      (r.failure_reason?.toLowerCase() || '').includes(ncrFilter.toLowerCase())
    );
    
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="card-transition">
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium text-gray-500">Total NCR Hours</h3>
              <p className="text-2xl font-bold text-sulzer-warning">{formatNumber(totalHours)}</p>
            </CardContent>
          </Card>
          <Card className="card-transition">
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium text-gray-500">NCR Cost</h3>
              <p className="text-2xl font-bold text-sulzer-danger">{formatMoney(totalCost)}</p>
            </CardContent>
          </Card>
          <Card className="card-transition">
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium text-gray-500">Total NCR Issues</h3>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(ncrs.length, 0)}</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Filter input */}
        <Input
          type="text"
          placeholder="🔍 Filter by part name, job number or failure reason..."
          className="max-w-md mb-4"
          value={ncrFilter}
          onChange={(e) => setNcrFilter(e.target.value)}
        />
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job #</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Center</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNcrs.map((row: NCRSummary, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{row.job_number || ''}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{row.part_name || ''}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{row.work_center || ''}</td>
                  <td className="px-3 py-2 text-sm text-gray-900">{row.failure_reason || ''}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.actual_hours || 0)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-sulzer-danger">{formatMoney(row.overrun_cost || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderWorkcenterTab(workcenters: WorkcenterSummary[]) {
    console.log("renderWorkcenterTab - received data:", workcenters);
    
    if (!workcenters || workcenters.length === 0) {
      return <div className="text-center py-4">No workcenter data available for this year.</div>;
    }

    const totalCost = workcenters.reduce((sum, r) => sum + (r.overrun_cost || 0), 0);
    
    // Check for work_center filtering
    const filteredWorkcenters = workcenters.filter(r => 
      (r.work_center?.toLowerCase() || '').includes(workcenterFilter.toLowerCase())
    );

    return (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded p-3">
            <h3 className="text-sm font-medium text-gray-500">Work Centers</h3>
            <p className="text-xl font-bold text-gray-900">{workcenters.length}</p>
          </div>
          
          <div className="bg-gray-50 rounded p-3">
            <h3 className="text-sm font-medium text-gray-500">Total Overrun Cost</h3>
            <p className="text-xl font-bold text-sulzer-danger">{formatMoney(totalCost)}</p>
          </div>
        </div>
        
        <Input
          type="text"
          placeholder="🔍 Filter work centers..."
          className="max-w-md mb-4"
          value={workcenterFilter}
          onChange={(e) => setWorkcenterFilter(e.target.value)}
        />
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" id="workcenterTable">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oper. WorkCenter</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jobs</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overrun</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWorkcenters.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm font-medium text-gray-900">{row.work_center || ''}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{row.job_count || 0}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{formatNumber(row.planned_hours || 0)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{formatNumber(row.actual_hours || 0)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{formatNumber(row.overrun_hours || 0)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-sulzer-danger">{formatMoney(row.overrun_cost || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderRepeatTab(repeats: any[]) {
    if (!repeats || repeats.length === 0) {
      return <div className="text-center py-4">No repeat NCR failures data available for this year.</div>;
    }
    
    // Check for repeat failures filtering
    const filteredRepeatNcrs = repeats.filter(r => 
      (r.part_name?.toLowerCase() || '').includes(repeatNcrFilter.toLowerCase())
    );

    return (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 mb-4">
          <div className="bg-gray-50 rounded p-3">
            <h3 className="text-sm font-medium text-gray-500">Repeat NCR Parts</h3>
            <p className="text-xl font-bold text-sulzer-warning">{repeats.length}</p>
          </div>
        </div>
        
        <Input
          type="text"
          placeholder="🔍 Filter repeat parts..."
          className="max-w-md mb-4"
          value={repeatNcrFilter}
          onChange={(e) => setRepeatNcrFilter(e.target.value)}
        />
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" id="repeatTable">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Jobs</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total NCRs</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Seen</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Years</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRepeatNcrs.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm font-medium text-gray-900">{row.part_name}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{row.total_jobs || 0}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-sulzer-warning">{row.total_ncrs || 0}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{row.first_seen_year || 'Unknown'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{row.years_occurring || 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderAdjustmentsTab() {
    if (!yearData.summary) {
      return <div className="text-center py-4">No job adjustment data available for this year.</div>;
    }

    const recommendedBuffer = yearData.summary.recommended_buffer_percent || 0;
    
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-50 rounded p-3">
            <h3 className="text-sm font-medium text-gray-500">Recommended Buffer</h3>
            <p className="text-xl font-bold text-sulzer-blue">{recommendedBuffer.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">Based on historical overruns</p>
          </div>
          
          <div className="bg-gray-50 rounded p-3">
            <h3 className="text-sm font-medium text-gray-500">Ghost Hours</h3>
            <p className="text-xl font-bold text-gray-500">{formatNumber(yearData.summary.ghost_hours || 0)}</p>
            <p className="text-xs text-gray-500 mt-1">Planned time with no recorded work</p>
          </div>
          
          <div className="bg-gray-50 rounded p-3">
            <h3 className="text-sm font-medium text-gray-500">Opportunity Cost</h3>
            <p className="text-xl font-bold text-sulzer-danger">{formatMoney(yearData.summary.opportunity_cost_dollars || 0)}</p>
            <p className="text-xs text-gray-500 mt-1">Lost revenue from overruns</p>
          </div>
          
          <div className="bg-gray-50 rounded p-3">
            <h3 className="text-sm font-medium text-gray-500">Planning Accuracy</h3>
            <p className="text-xl font-bold text-sulzer-warning">
              {yearData.summary.planning_accuracy ? 
                `${yearData.summary.planning_accuracy.toFixed(1)}%` : 
                'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">% of jobs within planned hours</p>
          </div>
        </div>
        
        <div className="mt-4 p-4 border rounded-md bg-white">
          <h3 className="font-medium text-lg mb-2">Adjustment Recommendations</h3>
          <p className="mb-4 text-sm text-gray-700">
            Based on {year} data analysis, we recommend the following adjustments:
          </p>
          
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
            <li><strong>Buffer Planning:</strong> Add a {recommendedBuffer.toFixed(1)}% buffer to all planned operations to account for typical overruns.</li>
            <li><strong>NCR Prevention:</strong> Focus on quality improvements for the most frequent NCR parts.</li>
            <li><strong>Workcenter Efficiency:</strong> Review processes in workcenters with highest overrun rates.</li>
            <li><strong>Job Estimation:</strong> Consider historical performance when quoting new jobs, especially for repeat parts.</li>
          </ul>
        </div>
      </div>
    );
  }
}
