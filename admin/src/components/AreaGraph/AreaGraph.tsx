import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Components
import AreaGraphTooltip from './AreaGraphTooltip';

// Helpers
import { getLocale, isValidDate, TimeScale } from '../../helpers';

// Hooks
import { useTheme } from 'styled-components';

// Strapi
import { Typography } from '@strapi/design-system';

// Styles
import { StyledAreaGraph } from './AreaGraph.style';

// Types
export type GraphData = {
  x: number | string;
  y: number | string;
};

export interface Props {
  label: string;
  data: GraphData[];
  scale?: TimeScale; // temporary
}

const AreaGraph = ({ label, data, scale }: Props) => {
  const theme = useTheme();
  const locale = getLocale();

  return (
    <StyledAreaGraph>
      <Typography variant="delta" fontWeight="bold" textColor="neutral800">
        {label}
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 16, left: -32, bottom: -4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.neutral150} />

          <XAxis
            dataKey="x"
            tick={{ fill: theme.colors.neutral600, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => {
              if (isValidDate(value)) {
                const date = new Date(value);

                const config: Intl.DateTimeFormatOptions = {};

                if (scale === 'minute' || scale === 'hour') {
                  config.day = 'numeric';
                  config.hour = 'numeric';
                  config.minute = 'numeric';
                }

                if (scale === 'day' || scale === 'week') {
                  config.month = 'short';
                  config.day = 'numeric';
                }

                if (scale === 'month') {
                  config.month = 'short';
                  config.year = 'numeric';
                }

                if (scale === 'year') config.year = 'numeric';

                return date.toLocaleString(locale, config);
              }

              return value;
            }}
          />

          <YAxis
            tick={{ fill: theme.colors.neutral600, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip content={<AreaGraphTooltip />} />

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
    </StyledAreaGraph>
  );
};

export default AreaGraph;
