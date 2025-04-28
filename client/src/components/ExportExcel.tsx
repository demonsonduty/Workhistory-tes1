import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";

interface ExportExcelProps {
  data: any[];
  filename?: string;
  sheetName?: string;
  buttonText?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
}

export default function ExportExcel({ 
  data, 
  filename = "work-history-export.xlsx", 
  sheetName = "Work History", 
  buttonText = "Export to Excel", 
  variant = "outline" 
}: ExportExcelProps) {
  const { toast } = useToast();

  const handleExport = () => {
    if (!data || data.length === 0) {
      toast({
        title: "Export failed",
        description: "No data available to export",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create a new workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Generate the XLSX file
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Export successful",
        description: `${data.length} records exported to ${filename}`,
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      
      toast({
        title: "Export failed",
        description: "There was an error exporting data to Excel",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      onClick={handleExport} 
      variant={variant}
      className="flex items-center space-x-2"
    >
      <FileSpreadsheet className="h-4 w-4" />
      <span>{buttonText}</span>
      <Download className="h-4 w-4" />
    </Button>
  );
}