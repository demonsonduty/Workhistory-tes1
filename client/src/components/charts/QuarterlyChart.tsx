import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney, formatNumber } from '@/lib/formatters';

interface QuarterlyChartProps {
  data: any[];
  onDataClick?: (data: any) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Card className="p-2 bg-white/95 border shadow-sm">
        <div className="text-sm font-medium mb-2">{label}</div>
        <div className="space-y-1 text-xs">
          {data.companies && (
            <div className="flex flex-col gap-1 mb-2">
              <span className="font-medium text-gray-600">Companies:</span>
              <div className="pl-2 text-xs">
                {data.companies.map((company: string, idx: number) => (
                  <div key={idx} className="text-gray-600">{company}</div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-medium text-blue-600">Planned Cost:</span>
            <span>{formatMoney(payload[0].value)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-red-600">Actual Cost:</span>
            <span>{formatMoney(data.actual_cost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-orange-500">Overrun %:</span>
            <span>{data.overrun_percentage}%</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-emerald-600">Job Count:</span>
            <span>{formatNumber(data.job_count)}</span>
          </div>
        </div>
      </Card>
    );
  }
  return null;
};

export default function QuarterlyChart({ data, onDataClick }: QuarterlyChartProps) {
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
          if (data && data.activePayload && onDataClick) {
            onDataClick(data.activePayload[0].payload);
          }
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#ddd' }}
          axisLine={{ stroke: '#ddd' }}
        />
        <YAxis
          yAxisId="left"
          orientation="left"
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#ddd' }}
          axisLine={{ stroke: '#ddd' }}
          label={{
            value: 'Cost ($)',
            angle: -90,
            position: 'insideLeft',
            style: { textAnchor: 'middle', fontSize: 12 }
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#ddd' }}
          axisLine={{ stroke: '#ddd' }}
          label={{
            value: 'Overrun %',
            angle: 90,
            position: 'insideRight',
            style: { textAnchor: 'middle', fontSize: 12 }
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: 10 }} />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="planned_cost"
          name="Planned Cost"
          fill="rgba(10, 61, 98, 0.1)"
          stroke="#0a3d62"
          strokeWidth={2}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="actual_cost"
          name="Actual Cost"
          fill="rgba(231, 76, 60, 0.1)"
          stroke="#e74c3c"
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="overrun_percentage"
          name="Overrun %"
          stroke="#f39c12"
          strokeWidth={2}
          dot={{ r: 3, fill: "#f39c12" }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
