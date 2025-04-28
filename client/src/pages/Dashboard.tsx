import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout, BarChart4, PieChart, LineChart, Upload, Clock3, Loader2, Factory } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

import SummaryMetrics from '@/components/SummaryMetrics';
import YearlyBreakdown from '@/components/YearlyBreakdown';
import CustomerProfitability from '@/components/CustomerProfitability';
import QuarterlyTrends from '@/components/QuarterlyTrends';
import WorkCenterTrends from '@/components/WorkCenterTrends';
import FilterBar from '@/components/FilterBar';
import ImportExcel from '@/components/ImportExcel';
import { useFilter } from '@/context/FilterContext';
import { useWorkHistorySummary } from '@/hooks/useWorkHistoryData';

export default function Dashboard() {
  const { filter } = useFilter();
  const [activeTab, setActiveTab] = useState("overview");
  const [showImport, setShowImport] = useState(false);
  const { toast } = useToast();

  const { 
    data: summaryData, 
    isLoading: isLoadingSummary, 
    error: summaryError, 
    refetch 
  } = useWorkHistorySummary();

  // Handle imported data from Excel file
  const handleImportSuccess = async (data: any) => {
    try {
      // Send the imported data to the server
      const response = await fetch('/api/workhistory/import', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Import successful",
          description: `${result.count} records processed successfully`,
        });

        // Refetch data to update dashboard
        refetch();
        setShowImport(false);
      } else {
        toast({
          title: "Import failed",
          description: "Failed to process the imported data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: "Import error",
        description: "An error occurred while importing the data",
        variant: "destructive"
      });
    }
  };

  if (isLoadingSummary) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (summaryError) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto mt-8">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {summaryError instanceof Error ? summaryError.message : 'An error occurred loading the dashboard data'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header section */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <BarChart4 className="h-8 w-8 text-sulzer-blue" />
                <span className="ml-2 text-xl font-semibold text-gray-900">Sulzer Performance Dashboard</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-2 border-sulzer-blue text-sulzer-blue hover:bg-sulzer-blue hover:text-white"
                onClick={() => setShowImport(!showImport)}
              >
                <Upload className="h-4 w-4" />
                {showImport ? 'Cancel Import' : 'Import Data'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {showImport && (
          <div className="mb-6">
            <ImportExcel onImportSuccess={handleImportSuccess} />
          </div>
        )}

        <FilterBar />

        <Tabs defaultValue="overview" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 md:w-auto md:inline-flex mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <Layout className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="yearly" className="flex items-center gap-1">
              <BarChart4 className="h-4 w-4" />
              <span className="hidden sm:inline">Yearly</span>
            </TabsTrigger>
            <TabsTrigger value="quarterly" className="flex items-center gap-1">
              <LineChart className="h-4 w-4" />
              <span className="hidden sm:inline">Quarterly</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-1">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Customers</span>
            </TabsTrigger>
            <TabsTrigger value="workcenters" className="flex items-center gap-1">
              <Factory className="h-4 w-4" />
              <span className="hidden sm:inline">Work Centers</span>
            </TabsTrigger>
          </TabsList>

          {activeTab === "overview" && (
            <TabsContent value="overview" className="space-y-8">
              <div>
                <h2 className="text-xl font-medium text-gray-800 mb-4 flex items-center">
                  <Layout className="mr-2 h-5 w-5 text-sulzer-blue" />
                  Summary Metrics
                </h2>
                <SummaryMetrics data={summaryData} isLoading={isLoadingSummary} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h2 className="text-xl font-medium text-gray-800 mb-4 flex items-center">
                    <BarChart4 className="mr-2 h-5 w-5 text-sulzer-blue" />
                    Performance Trends
                  </h2>
                  <YearlyBreakdown />
                </div>

                <div className="lg:col-span-1">
                  <h2 className="text-xl font-medium text-gray-800 mb-4 flex items-center">
                    <Clock3 className="mr-2 h-5 w-5 text-sulzer-blue" />
                    Recent Activity
                  </h2>
                  <QuarterlyTrends />
                </div>
              </div>
            </TabsContent>
          )}

          {activeTab === "yearly" && (
            <TabsContent value="yearly">
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-gray-800 mb-4 flex items-center">
                  <BarChart4 className="mr-2 h-5 w-5 text-sulzer-blue" />
                  Yearly Performance Breakdown
                </h2>
                <YearlyBreakdown />
              </div>
            </TabsContent>
          )}

          {activeTab === "quarterly" && (
            <TabsContent value="quarterly">
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-gray-800 mb-4 flex items-center">
                  <LineChart className="mr-2 h-5 w-5 text-sulzer-blue" />
                  Quarterly Performance Trends
                </h2>
                <div className="h-[400px]">
                  <QuarterlyTrends />
                </div>
              </div>
            </TabsContent>
          )}

          {activeTab === "customers" && (
            <TabsContent value="customers">
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-gray-800 mb-4 flex items-center">
                  <PieChart className="mr-2 h-5 w-5 text-sulzer-blue" />
                  Customer Profitability Analysis
                </h2>
                <CustomerProfitability />
              </div>
            </TabsContent>
          )}

          {activeTab === "workcenters" && (
            <TabsContent value="workcenters">
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-gray-800 mb-4 flex items-center">
                  <Factory className="mr-2 h-5 w-5 text-sulzer-blue" />
                  Work Center Trends
                </h2>
                <WorkCenterTrends />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            Sulzer Performance Dashboard &copy; {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  );
}
