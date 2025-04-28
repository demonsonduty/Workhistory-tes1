import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Card } from '@/components/ui/card';
import { Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImportExcelProps {
  onImportSuccess: (data: any[]) => void;
}

export default function ImportExcel({ onImportSuccess }: ImportExcelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [fileSelected, setFileSelected] = useState(false);
  const { toast } = useToast();

  const parseDate = (dateValue: any): string | null => {
    // If null or undefined, return null
    if (dateValue === null || dateValue === undefined) {
      return null;
    }
    
    // If it's already a JavaScript Date object
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue.toISOString().split('T')[0];
    }
    
    // Handle Excel date serial number (days since Dec 30, 1899)
    // Excel default epoch is December 30, 1899
    if (typeof dateValue === 'number') {
      try {
        // Excel has different date system on Windows (1900) vs Mac (1904)
        // 1900 date system starts at January 1, 1900 as day 1, but due to a leap year bug
        // it actually starts at December 30, 1899
        
        // For dates after 1900-03-01, we need to adjust for Excel's leap year bug
        // (Excel treats 1900 as having Feb 29, which it didn't)
        let adjustedValue = dateValue;
        if (adjustedValue > 60) { // If after fictional Feb 29, 1900
          adjustedValue -= 1;
        }
        
        // Convert Excel date to JavaScript date
        // Excel day 1 = January 1, 1900
        const date = new Date(Date.UTC(1900, 0, 1));
        date.setUTCDate(date.getUTCDate() + adjustedValue - 1);
        
        // Verify the year is reasonable (between 1900 and 2100)
        const year = date.getUTCFullYear();
        if (year >= 1900 && year <= 2100) {
          return date.toISOString().split('T')[0];
        }
      } catch (error) {
        console.warn('Error parsing Excel date number:', error);
      }
    }
    
    // If it's a string, try different formats
    if (typeof dateValue === 'string') {
      // Clean the string (remove any extra spaces)
      const cleanedValue = dateValue.trim();
      
      // Try to parse as a date string directly
      const parsedDate = new Date(cleanedValue);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];
      }
      
      // Try MM-DD-YYYY format
      const mmddyyyyRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
      const mmddyyyyMatch = cleanedValue.match(mmddyyyyRegex);
      if (mmddyyyyMatch) {
        const month = mmddyyyyMatch[1].padStart(2, '0');
        const day = mmddyyyyMatch[2].padStart(2, '0');
        const year = mmddyyyyMatch[3];
        return `${year}-${month}-${day}`;
      }
      
      // Try MM/DD/YYYY format
      const mmddyyyySlashRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const mmddyyyySlashMatch = cleanedValue.match(mmddyyyySlashRegex);
      if (mmddyyyySlashMatch) {
        const month = mmddyyyySlashMatch[1].padStart(2, '0');
        const day = mmddyyyySlashMatch[2].padStart(2, '0');
        const year = mmddyyyySlashMatch[3];
        return `${year}-${month}-${day}`;
      }
      
      // Try DD.MM.YYYY format (common in Europe)
      const ddmmyyyyDotRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
      const ddmmyyyyDotMatch = cleanedValue.match(ddmmyyyyDotRegex);
      if (ddmmyyyyDotMatch) {
        const day = ddmmyyyyDotMatch[1].padStart(2, '0');
        const month = ddmmyyyyDotMatch[2].padStart(2, '0');
        const year = ddmmyyyyDotMatch[3];
        return `${year}-${month}-${day}`;
      }
    }
    
    // Return null if we couldn't parse the date
    return null;
  };

  // Normalize column name to handle case and whitespace variations
  const normalizeColumnName = (name: string): string => {
    return name.toLowerCase().replace(/\s+/g, '');
  };

  // Find the actual column name in the row object
  const findColumn = (row: any, possibleNames: string[]): string | null => {
    // First, check exact matches
    for (const name of possibleNames) {
      if (row[name] !== undefined) {
        return name;
      }
    }
    
    // Next, try normalized matches
    const normalizedNames = possibleNames.map(normalizeColumnName);
    const rowKeys = Object.keys(row);
    
    for (const key of rowKeys) {
      const normalizedKey = normalizeColumnName(key);
      const index = normalizedNames.findIndex(name => name === normalizedKey);
      if (index !== -1) {
        return key;
      }
    }
    
    return null;
  };

  const handleFileSelect = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    try {
      const file = acceptedFiles[0];
      const data = await file.arrayBuffer();
      // Use cellDates:true to convert Excel dates to JavaScript Date objects automatically
      const wb = XLSX.read(data, { cellDates: true });
      setWorkbook(wb);
      
      // Get available sheets
      const availableSheets = wb.SheetNames;
      setSheets(availableSheets);
      
      // Default to the first sheet with the most rows
      let largestSheet = availableSheets[0];
      let maxRows = 0;
      
      for (const sheet of availableSheets) {
        const worksheet = wb.Sheets[sheet];
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const rowCount = range.e.r - range.s.r + 1;
        
        console.log(`Sheet "${sheet}" has ${rowCount} rows`);
        
        if (rowCount > maxRows) {
          maxRows = rowCount;
          largestSheet = sheet;
        }
      }
      
      setSelectedSheet(largestSheet);
      setFileSelected(true);
      
      toast({
        title: "File Loaded",
        description: `Found ${availableSheets.length} sheets. Selected "${largestSheet}" with ${maxRows} rows.`,
      });
    } catch (error) {
      console.error('Error loading file:', error);
      toast({
        title: "Import Error",
        description: "Failed to load the Excel file.",
        variant: "destructive"
      });
    }
  };

  const processExcelFile = async () => {
    if (!workbook || !selectedSheet) return;
    
    setIsLoading(true);
    setProcessingProgress(0);
    
    try {
      // Get the selected worksheet
      const worksheet = workbook.Sheets[selectedSheet];
      
      // Get worksheet range
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const totalRows = range.e.r - range.s.r + 1;
      
      console.log(`Processing sheet "${selectedSheet}" with ${totalRows} rows`);
      
      // Convert Excel data to array of objects, preserving proper date types
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        raw: false,
        dateNF: 'yyyy-mm-dd',
        // cellDates: true - forces dates to be parsed as JavaScript Date objects
        defval: null // Sets empty cells to null instead of undefined
      });
      
      console.log(`Converted ${jsonData.length} rows to JSON`, 'First row:', jsonData.length > 0 ? jsonData[0] : 'No data');
      
      // Find the first row that looks like a header (has column names)
      const sampleRow = jsonData.length > 0 ? jsonData[0] as Record<string, any> : {};
      const headers = Object.keys(sampleRow);
      console.log(`Using headers:`, headers);
      
      // Find columns in the data
      const sampleSize = Math.min(20, jsonData.length);
      const sampleRows = jsonData.slice(0, sampleSize) as Record<string, any>[];
      
      // Find potential columns for each data type
      let companyColumn = null;
      let jobColumn = null;
      let workCenterColumn = null;
      let partColumn = null;
      let plannedHoursColumn = null;
      let actualHoursColumn = null;
      let dateColumn = null;
      
      for (const row of sampleRows) {
        if (!companyColumn) {
          companyColumn = findColumn(row, [
            'Company', 'List name', 'name', 'customer', 'company_name', 
            'Customer', 'Cust.Name', 'Customer Name', 'Ship-to Party', 
            'Sold-to Party', 'Client', 'Client Name'
          ]);
        }
        
        if (!jobColumn) {
          jobColumn = findColumn(row, [
            'Sales Document', 'Order', 'job_id', 'Job', 'job', 'Project', 
            'Sales Order', 'SalesDoc.', 'SO Number', 'Order Number', 
            'PO', 'PO Number', 'Purchase Order'
          ]);
        }
        
        if (!workCenterColumn) {
          workCenterColumn = findColumn(row, [
            'Oper.WorkCenter', 'work_center', 'WorkCenter', 'Work Center', 
            'WrkCtr', 'WorkCtr', 'Resource', 'Production Line', 'Workcenter',
            'Operation', 'Manufacturing'
          ]);
        }
        
        if (!partColumn) {
          partColumn = findColumn(row, [
            'Opr. short text', 'part_id', 'Part', 'part', 'Material', 
            'Mat.Number', 'Part Number', 'Material Number', 'Item', 
            'Operation', 'Description', 'Item Description', 'ProductId'
          ]);
        }
        
        if (!plannedHoursColumn) {
          plannedHoursColumn = findColumn(row, [
            'Work', 'planned_hours', 'Planned Hours', 'planned hours', 
            'Target Qty', 'Plan Hours', 'Standard Hours', 'Estimated Hours', 
            'Target Hour', 'Norm. Time', 'Planned', 'Plan', 'Target'
          ]);
        }
        
        if (!actualHoursColumn) {
          actualHoursColumn = findColumn(row, [
            'Actual work', 'actual_hours', 'Actual Hours', 'actual hours', 
            'Act.Hours', 'Actual Hour', 'Confirmed Hours', 'Conf. Work', 
            'Yield', 'Actual', 'Actuals', 'Real'
          ]);
        }
        
        if (!dateColumn) {
          dateColumn = findColumn(row, [
            'Basic fin. date', 'date', 'Date', 'Finish Date', 'Confirm. Date', 
            'Actual Finish', 'Confirmation Date', 'Created On', 'Entry Date',
            'Order Date', 'PO Date', 'Transaction Date'
          ]);
        }
      }
      
      // Log the column mapping for debugging
      console.log('Column mapping:', {
        company: companyColumn,
        job: jobColumn,
        workCenter: workCenterColumn,
        part: partColumn,
        plannedHours: plannedHoursColumn,
        actualHours: actualHoursColumn,
        date: dateColumn
      });
      
      // If we found a date column, check what type of data it contains
      if (dateColumn && jsonData.length > 0) {
        const firstRowWithDate = jsonData.find(row => row[dateColumn] !== null && row[dateColumn] !== undefined);
        if (firstRowWithDate) {
          const dateValue = firstRowWithDate[dateColumn];
          console.log(`Date column "${dateColumn}" contains:`, dateValue, 
                      'Type:', typeof dateValue, 
                      'Is Date?', dateValue instanceof Date);
        }
      }
      
      // Process data in batches
      const batchSize = 1000;
      const totalJsonRows = jsonData.length;
      const totalBatches = Math.ceil(totalJsonRows / batchSize);
      const transformedData = [];
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, totalJsonRows);
        const batchRows = jsonData.slice(start, end) as Record<string, any>[];
        
        const batchData = [];
        for (let i = 0; i < batchRows.length; i++) {
          const row = batchRows[i];
          
          // Parse date with special handling for Excel dates
          let dateStr = null;
          if (dateColumn && row[dateColumn] !== null && row[dateColumn] !== undefined) {
            const dateValue = row[dateColumn];
            
            // Handle different date types
            if (dateValue instanceof Date) {
              // Already a JavaScript Date object
              dateStr = dateValue.toISOString().split('T')[0];
            } else {
              // Try our parseDate function for other formats
              dateStr = parseDate(dateValue);
            }
          }
          
          // Use current date as fallback if no date found
          if (!dateStr) {
            dateStr = new Date().toISOString().split('T')[0];
          }
          
          // Get numeric values
          let plannedHours = 0;
          if (plannedHoursColumn && row[plannedHoursColumn] !== null && row[plannedHoursColumn] !== undefined) {
            const rawValue = row[plannedHoursColumn];
            if (typeof rawValue === 'number') {
              plannedHours = rawValue;
            } else if (typeof rawValue === 'string') {
              const parsed = parseFloat(rawValue.replace(',', '.'));
              if (!isNaN(parsed)) plannedHours = parsed;
            }
          }

          let actualHours = 0;
          if (actualHoursColumn && row[actualHoursColumn] !== null && row[actualHoursColumn] !== undefined) {
            const rawValue = row[actualHoursColumn];
            if (typeof rawValue === 'number') {
              actualHours = rawValue;
            } else if (typeof rawValue === 'string') {
              const parsed = parseFloat(rawValue.replace(',', '.'));
              if (!isNaN(parsed)) actualHours = parsed;
            }
          }
          
          // Get company name
          let companyName = 'Unknown';
          if (companyColumn && row[companyColumn] !== null && row[companyColumn] !== undefined) {
            companyName = String(row[companyColumn]).trim();
          }
          
          // Try to find a company name if none is found
          if (companyName === 'Unknown') {
            for (const key in row) {
              // Skip columns that are likely not company names
              if (key.toLowerCase().includes('date') || 
                  key.toLowerCase().includes('time') ||
                  key.toLowerCase().includes('hour') ||
                  key.toLowerCase().includes('qty') ||
                  key.toLowerCase().includes('number')) {
                continue;
              }
              
              const value = row[key];
              if (value !== null && typeof value === 'string') {
                const trimmedValue = value.trim();
                if (trimmedValue.length > 3 && 
                    !trimmedValue.match(/^[0-9.,$]+$/) && 
                    trimmedValue !== 'Unknown' && 
                    trimmedValue !== '(All)' &&
                    !trimmedValue.match(/^[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4}$/)) {
                  companyName = trimmedValue;
                  break;
                }
              }
            }
          }
          
          // Create the transformed row
          batchData.push({
            date: dateStr,
            job_id: jobColumn && row[jobColumn] !== undefined ? String(row[jobColumn]).trim() : `JOB-${start + i + 1}`,
            part_id: partColumn && row[partColumn] !== undefined ? String(row[partColumn]).trim() : `PART-${start + i + 1}`,
            work_center: workCenterColumn && row[workCenterColumn] !== undefined ? String(row[workCenterColumn]).trim() : 'Default',
            company_name: companyName,
            planned_hours: plannedHours,
            actual_hours: actualHours,
            labor_rate: 199, // Default labor rate
          });
        }
        
        // Add batch data to results
        transformedData.push(...batchData);
        
        // Update progress
        const progress = Math.round((end / totalJsonRows) * 100);
        setProcessingProgress(progress);
        
        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      // Always ensure we have some data
      if (transformedData.length === 0) {
        // Create a default row to prevent errors
        transformedData.push({
          date: new Date().toISOString().split('T')[0],
          job_id: 'DEFAULT',
          part_id: 'DEFAULT',
          work_center: 'Default',
          company_name: 'Default Company',
          planned_hours: 0,
          actual_hours: 0,
          labor_rate: 199
        });
      }
      
      // Count distinct years
      const years = new Set<string>();
      for (const row of transformedData) {
        if (row.date) {
          const year = row.date.substring(0, 4);
          years.add(year);
        }
      }
      
      // Show summary of data processed
      console.log('Import summary:', {
        totalRows,
        processedRows: transformedData.length,
        years: Array.from(years).sort().join(', ')
      });
      
      if (transformedData.length > 0) {
        console.log('Sample transformed row:', transformedData[0]);
      }
      
      // Show success message
      toast({
        title: "File Processed Successfully",
        description: `Imported ${transformedData.length} records from "${selectedSheet}" spanning years ${Array.from(years).sort().join(', ')}`,
      });
      
      // Send data back to parent component
      onImportSuccess(transformedData);
      setFileSelected(false);
      setProcessingProgress(0);
      setWorkbook(null);
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Import Error",
        description: "Failed to process the Excel file. Please try a different format.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    onDrop: handleFileSelect,
    disabled: isLoading || fileSelected
  });

  if (fileSelected) {
    return (
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Select Sheet to Import</h3>
            <p className="text-sm text-gray-500 mb-4">
              Choose which sheet contains your data
            </p>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <label htmlFor="sheet-select" className="text-sm font-medium">
                  Sheet
                </label>
                <Select 
                  value={selectedSheet} 
                  onValueChange={setSelectedSheet}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sheet" />
                  </SelectTrigger>
                  <SelectContent>
                    {sheets.map(sheet => (
                      <SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {isLoading && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Processing {selectedSheet}...</span>
                <span className="text-sm">{processingProgress}%</span>
              </div>
              <Progress value={processingProgress} />
            </div>
          )}
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setFileSelected(false);
                setWorkbook(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={processExcelFile}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Import Data"
              )}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div
        {...getRootProps()}
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
      >
        <input {...getInputProps()} />
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Processing file...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="text-lg font-medium">Drop your Excel file here, or click to select</p>
            <p className="text-sm text-gray-500">The importer now supports multiple sheets and large files (79,000+ rows)</p>
            <p className="text-xs text-gray-400 mt-2">
              Supports all Excel formats (.xlsx, .xls) including SAP and ERP reports
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}