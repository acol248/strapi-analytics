import { Bar, BarChart, CartesianGrid, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Components
import AreaGraphTooltip from '../AreaGraph/AreaGraphTooltip';

// Helpers
import { getLocale, isValidDate, TimeScale } from '../../helpers';

// Hooks
import { useTheme } from 'styled-components';

// Strapi
import { Typography } from '@strapi/design-system';

// Styles
import { StyledBarGraph } from './BarGraph.style';

// Types
import { GraphData } from '../AreaGraph/AreaGraph';

export interface Props {
  label: string;
  data: GraphData[];
  scale?: TimeScale;
}

const BarGraph = ({ label, data, scale }: Props) => {
  const theme = useTheme();
  const locale = getLocale();
  const borderRadius = parseInt(theme.borderRadius, 10) || 4;

  return (
    <StyledBarGraph>
      <Typography variant="delta" fontWeight="bold" textColor="neutral800">
        {label}
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 16, left: -32, bottom: -4 }}>
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

          <Tooltip content={<AreaGraphTooltip />} cursor={{ fill: theme.colors.neutral150, opacity: 0.5 }} />

          <Bar
            dataKey="y"
            name="Events"
            fill={theme.colors.primary600}
            radius={[borderRadius, borderRadius, 0, 0]}
            activeBar={<Rectangle fill={theme.colors.primary700} radius={[borderRadius, borderRadius, 0, 0]} />}
          />
        </BarChart>
      </ResponsiveContainer>
    </StyledBarGraph>
  );
};

export default BarGraph;
