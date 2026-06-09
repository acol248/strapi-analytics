import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Hooks
import { useTheme } from 'styled-components';

// Types
export type GraphData = {
  x: number | string;
  y: number | string;
};

export interface Props {
  data: GraphData[];
}

const AreaGraph = ({ data }: Props) => {
  const theme = useTheme();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.neutral200} />

        <XAxis
          dataKey="x"
          tick={{ fill: theme.colors.neutral600, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />

        <YAxis
          tick={{ fill: theme.colors.neutral600, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />

        <Tooltip
          labelFormatter={(t) => new Date(t).toLocaleString('en-GB')}
          contentStyle={{
            background: theme.colors.neutral0,
            border: `1px solid ${theme.colors.neutral200}`,
            borderRadius: '4px',
            fontSize: '12px',
          }}
        />

        <Area
          type="monotone"
          dataKey="y"
          name="Page Views"
          stroke={theme.colors.primary600}
          fillOpacity={0.1}
          fill={theme.colors.primary600}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default AreaGraph;
