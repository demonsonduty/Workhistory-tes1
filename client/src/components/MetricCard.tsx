import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  colorClass?: string;
  tooltip?: string;
  onClick?: () => void;
}

export default function MetricCard({ 
  label, 
  value, 
  subLabel, 
  colorClass = "", 
  tooltip = "",
  onClick 
}: MetricCardProps) {
  return (
    <Card className="card-transition shadow-sm" onClick={onClick}>
      <CardContent className="p-4">
        <div className="card-label d-flex justify-between items-center">
          {label}
          {tooltip && <span className="ms-2 text-muted" title={tooltip}>❔</span>}
        </div>
        <div className={`card-value text-2xl font-bold ${colorClass}`}>{value}</div>
        {subLabel && <div className="mt-2 text-sm font-medium">{subLabel}</div>}
      </CardContent>
    </Card>
  );
}
