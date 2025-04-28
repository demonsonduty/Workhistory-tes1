import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useFilter } from "@/context/FilterContext";
import { Button } from "@/components/ui/button";
import { Filter, RefreshCw, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import ExportExcel from "./ExportExcel";
import { FullSummaryData, YearBreakdown } from "@/types/summaryData";

export default function FilterBar() {
  const { filter, setFilter, resetFilters } = useFilter();
  const [years, setYears] = useState<string[]>([]);
  const [customers, setCustomers] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [workCenters, setWorkCenters] = useState<string[]>([]);

  // Fetch filter options from the API
  const { data: yearlyData, isLoading: isYearlyDataLoading } = useQuery<YearBreakdown[]>({
    queryKey: ['/api/workhistory/summary/yearly'],
  });

  const { data: fullSummary, isLoading: isFullSummaryLoading } = useQuery<FullSummaryData>({
    queryKey: ['/api/workhistory/summary/full'],
  });

  // Extract available filter options from the data
  useEffect(() => {
    if (yearlyData && yearlyData.length > 0) {
      const extractedYears = yearlyData.map(item => item.year);
      setYears(extractedYears);
      
      // Extract unique customers from yearly data
      const allCustomers: string[] = [];
      yearlyData.forEach(year => {
        if (year.companies && Array.isArray(year.companies)) {
          year.companies.forEach(company => {
            if (company && !allCustomers.includes(company)) {
              allCustomers.push(company);
            }
          });
        }
      });
      
      if (allCustomers.length > 0) {
        setCustomers(allCustomers.sort());
      }
    }

    if (fullSummary?.workcenter_breakdown) {
      const centers = fullSummary.workcenter_breakdown.map(wc => wc.work_center);
      // Fix the Set iteration issue by converting to Array first
      const uniqueCentersSet = new Set(centers);
      const uniqueCenters = Array.from(uniqueCentersSet).filter(Boolean); // Remove empty values
      setWorkCenters(uniqueCenters);
    }

    // For demo purposes, set static values for job types
    // In a real implementation, this would also come from the API
    setJobTypes(['Repair', 'Maintenance', 'Installation', 'Overhaul', 'Inspection']);
  }, [yearlyData, fullSummary]);

  const handleYearChange = (value: string) => {
    setFilter({ ...filter, year: value });
  };

  const handleCustomerChange = (value: string) => {
    setFilter({ ...filter, customer: value });
  };

  const handleJobTypeChange = (value: string) => {
    setFilter({ ...filter, jobType: value });
  };

  const handleWorkCenterChange = (value: string) => {
    setFilter({ ...filter, workCenter: value });
  };

  // Prepare export data from the summary
  const getExportData = () => {
    const exportData: Array<Record<string, any>> = [];

    if (fullSummary?.yearly_breakdown) {
      for (const year of fullSummary.yearly_breakdown) {
        exportData.push({
          Year: year.year,
          'Planned Hours': year.planned_hours,
          'Actual Hours': year.actual_hours,
          'Overrun Hours': year.overrun_hours,
          'NCR Hours': year.ncr_hours,
          'Job Count': year.job_count,
          'Operations': year.operation_count,
          'Customers': year.customer_count
        });
      }
    }

    return exportData;
  };

  return (
    <Card className="shadow-sm mb-6 overflow-hidden border border-gray-100">
      <CardHeader className="bg-gray-50 py-3 px-4">
        <CardTitle className="text-lg font-medium flex items-center space-x-2">
          <Filter className="h-5 w-5 text-sulzer-blue" />
          <span>Filter Dashboard</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="w-full lg:w-1/4">
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Year</Label>
            <Select value={filter.year} onValueChange={handleYearChange}>
              <SelectTrigger className="w-full bg-white border focus:ring-1 focus:ring-sulzer-blue focus:border-sulzer-blue">
                <SelectValue placeholder={isYearlyDataLoading ? "Loading..." : "All Years"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.filter(Boolean).map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full lg:w-1/4">
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Customer</Label>
            <Select value={filter.customer} onValueChange={handleCustomerChange}>
              <SelectTrigger className="w-full bg-white border focus:ring-1 focus:ring-sulzer-blue focus:border-sulzer-blue">
                <SelectValue placeholder={isYearlyDataLoading ? "Loading..." : "All Customers"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.filter(Boolean).map(customer => {
                  const value = customer.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <SelectItem key={customer} value={value}>{customer}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full lg:w-1/4">
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Job Type</Label>
            <Select value={filter.jobType} onValueChange={handleJobTypeChange}>
              <SelectTrigger className="w-full bg-white border focus:ring-1 focus:ring-sulzer-blue focus:border-sulzer-blue">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {jobTypes.filter(Boolean).map(type => {
                  const value = type.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <SelectItem key={type} value={value}>{type}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full lg:w-1/4">
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Work Center</Label>
            <Select value={filter.workCenter} onValueChange={handleWorkCenterChange}>
              <SelectTrigger className="w-full bg-white border focus:ring-1 focus:ring-sulzer-blue focus:border-sulzer-blue">
                <SelectValue placeholder={isFullSummaryLoading ? "Loading..." : "All Centers"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Centers</SelectItem>
                {workCenters.filter(Boolean).map(center => {
                  const value = center.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <SelectItem key={center} value={value}>{center}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <Button
            variant="outline"
            onClick={resetFilters}
            className="flex items-center gap-2 text-gray-600 hover:text-sulzer-blue"
          >
            <RefreshCw className="h-4 w-4" />
            Reset Filters
          </Button>

          <ExportExcel
            data={getExportData()}
            filename="sulzer-work-history.xlsx"
            sheetName="Work History Summary"
            buttonText="Export Data"
          />
        </div>
      </CardContent>
    </Card>
  );
}
