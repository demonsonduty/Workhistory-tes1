import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ProfitabilityChartProps {
  data: any;
  type: 'profitable' | 'overrun';
}

export default function ProfitabilityChart({ data, type }: ProfitabilityChartProps) {
  // Format data for the chart
  const chartData = data.labels.map((label: string, index: number) => ({
    name: label,
    value: data.datasets[0].data[index]
  }));

  const COLORS = data.datasets[0].backgroundColor;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          innerRadius={40}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [`${value}%`, type === 'profitable' ? 'Profit Share' : 'Overrun Share']}
        />
        <Legend layout="vertical" verticalAlign="middle" align="right" />
      </PieChart>
    </ResponsiveContainer>
  );
}
