import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  TooltipProps
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber, formatMoney } from "@/lib/formatters";
import { YearBreakdown } from "@/types/workHistory";

interface YearlyTrendsChartProps {
  data: YearBreakdown[];
  onYearClick?: (year: string) => void;
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <Card className="p-2 bg-white/95 border shadow-sm min-w-[200px]">
        <div className="text-sm font-medium mb-2">{`Year ${label}`}</div>
        <div className="space-y-1 text-xs">
          {payload.map((entry: any, index: number) => (
            <div
              key={`item-${index}`}
              className="flex justify-between"
              style={{ color: entry.color }}
            >
              <span className="font-medium">{entry.name}:</span>
              <span>
                {entry.name.includes('Hours')
                  ? formatNumber(entry.value)
                  : entry.name.includes('Cost')
                    ? formatMoney(entry.value)
                    : entry.value}
              </span>
            </div>
          ))}
        </div>
      </Card>
    );
  }
  return null;
};

export default function YearlyTrendsChart({ data, onYearClick }: YearlyTrendsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        onClick={(data) => {
          if (data && data.activePayload && onYearClick) {
            onYearClick(data.activePayload[0].payload.year);
          }
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#ddd' }}
          axisLine={{ stroke: '#ddd' }}
        />
        <YAxis
          yAxisId="left"
          domain={[0, 'auto']}
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#ddd' }}
          axisLine={{ stroke: '#ddd' }}
          label={{
            value: 'Hours',
            angle: -90,
            position: 'insideLeft',
            style: { textAnchor: 'middle', fontSize: 12 }
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 'auto']}
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#ddd' }}
          axisLine={{ stroke: '#ddd' }}
          label={{
            value: 'Job Count',
            angle: 90,
            position: 'insideRight',
            style: { textAnchor: 'middle', fontSize: 12 }
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: 10 }} />
        <ReferenceLine
          yAxisId="left"
          isFront
          stroke="#9ca3af"
          strokeDasharray="3 3"
          strokeWidth={1}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="overrun_hours"
          name="Overrun Hours"
          fill="rgba(239, 68, 68, 0.2)"
          stroke="rgba(239, 68, 68, 0.2)"
          stackId="1"
        />
        <Bar
          yAxisId="left"
          dataKey="planned_hours"
          name="Planned Hours"
          fill="#1e40af"
          barSize={30}
          radius={[4, 4, 0, 0]}
        />
        <Bar
          yAxisId="left"
          dataKey="actual_hours"
          name="Actual Hours"
          fill="#ef4444"
          barSize={30}
          radius={[4, 4, 0, 0]}
          fillOpacity={0.85}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="job_count"
          name="Job Count"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3, fill: "#10b981" }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
